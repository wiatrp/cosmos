# encoding: ascii-8bit

# Copyright 2020 Ball Aerospace & Technologies Corp.
# All Rights Reserved.
#
# This program is free software; you can modify and/or redistribute it
# under the terms of the GNU General Public License
# as published by the Free Software Foundation; version 3 with
# attribution addendums as found in the LICENSE.txt

require 'cosmos/microservices/microservice'

module Cosmos
  class CvtMicroservice < Microservice
    def run
      kafka_consumer_loop do |message|
        begin
          cvt_data(message)
          break if @cancel_thread
        rescue => err
          Logger.error("Cvt error: #{err.formatted}")
        end
      end
    end

    def cvt_data(kafka_message)
      json_hash = JSON.parse(kafka_message.value)
      cvt_hash = {}
      json_hash.each do |key, value|
        cvt_hash["#{target_name}__#{packet_name}__#{key}"] = value
      end

      @redis.mapped_mset(cvt_hash)
    end
  end
end

Cosmos::CvtMicroservice.run if __FILE__ == $0