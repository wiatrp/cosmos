# encoding: ascii-8bit

# Copyright 2020 Ball Aerospace & Technologies Corp.
# All Rights Reserved.
#
# This program is free software; you can modify and/or redistribute it
# under the terms of the GNU General Public License
# as published by the Free Software Foundation; version 3 with
# attribution addendums as found in the LICENSE.txt

require 'kafka'
require 'json'
require 'redis'
require 'fileutils'
require 'aws-sdk-s3'
require 'zip'
require 'zip/filesystem'
require 'cosmos'

Aws.config.update(
  endpoint: 'http://localhost:9000',
  access_key_id: 'minioadmin',
  secret_access_key: 'minioadmin',
  force_path_style: true,
  region: 'us-east-1'
)

module Cosmos
  class Microservice
    def self.run
      begin
        microservice = self.new(ARGV[0])
        microservice.run
      rescue Exception => err
        unless err.class == SystemExit or err.class == Interrupt
          Logger.fatal("Microservice #{ARGV[0]} dying from exception\n#{err.formatted}")
        end
      end
    end

    def initialize(name)
      raise "Microservice must be named" unless name
      @name = name
      @cancel_thread = false
      Logger.microservice_name = @name
      Logger.tag = @name + ".log"

      # Create temp folder for this microservice
      @temp_dir = Dir.mktmpdir
      FileUtils.mkdir_p("#{@temp_dir}/targets")

      # Get microservice configuration from Redis
      @redis = Redis.new(url: "redis://localhost:6379/0")
      @config = @redis.hget('cosmos_microservices', name)
      if @config
        @config = JSON.parse(@config)
      else
        @config = {}
      end

      # Get configuration for any targets from Minio/S3
      target_list = @config["target_list"]
      target_list ||= []
      rubys3_client = Aws::S3::Client.new
      target_list.each do |item|
        # Retrieve bucket/targets/target_name/target_id.zip
        response_target = "#{@temp_dir}/targets/#{item["target_id"]}.zip"
        FileUtils.mkdir_p(File.dirname(response_target))
        if item["original_name"]
          s3_key = "#{item["original_name"]}/#{item["target_id"]}.zip"
        else
          s3_key = "#{item["target_name"]}/#{item["target_id"]}.zip"
        end
        Logger.info("Retrieving #{s3_key} from targets bucket")
        rubys3_client.get_object(bucket: "targets", key: s3_key, response_target: response_target)
        Zip::File.open(response_target) do |zip_file|
          zip_file.each do |entry|
            path = File.join("#{@temp_dir}/targets", entry.name)
            FileUtils.mkdir_p(File.dirname(path))
            zip_file.extract(entry, path) unless File.exist?(path)
          end
        end
      end

      # Build System from targets
      System.instance(target_list, "#{@temp_dir}/targets")

      # Setup Kafka connection
      @kafka_client = Kafka.new(["localhost:29092"], client_id: name)

      # Use at_exit to shutdown cleanly no matter how we are die
      at_exit do
        shutdown()
      end
    end

    def kafka_consumer_loop
      begin
        Logger.info "Starting Kafka subscription processing for #{@name}"

        @consumer = @kafka_client.consumer(group_id: @name)
        @config["topics"].each do |topic_name|
          Logger.info("Microservice #{@name} subscribing to topic #{topic_name}")
          @consumer.subscribe(topic_name)
        end
        @consumer.each_message do |message|
          yield message
        end
      rescue Exception => error
        Logger.error "Kafka subscription thread unexpectedly died for #{@name}"
        Cosmos.handle_fatal_exception(error)
      end
      Logger.info "Stopped Kafka subscription processing for #{@name}"
    end

    def shutdown
      FileUtils.remove_entry(@temp_dir)
    end
  end
end