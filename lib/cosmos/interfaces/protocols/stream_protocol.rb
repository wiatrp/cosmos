# encoding: ascii-8bit

# Copyright 2017 Ball Aerospace & Technologies Corp.
# All Rights Reserved.
#
# This program is free software; you can modify and/or redistribute it
# under the terms of the GNU General Public License
# as published by the Free Software Foundation; version 3 with
# attribution addendums as found in the LICENSE.txt

require 'cosmos/config/config_parser'
require 'cosmos/interfaces/protocols/protocol'
require 'thread'

module Cosmos
  # Processes a {Cosmos::Stream} on behalf of an {Cosmos::Interface}.
  # A {Cosmos::Stream} is a primative interface that simply reads and writes
  # raw binary data. The StreamProtocol adds higher level processing including
  # the ability todiscard a certain number of bytes from the stream and to sync
  # the stream on a given synchronization pattern. The StreamProtocol operates
  # at the {Cosmos::Packet} abstraction level while the {Cosmos::Stream}
  # operates on raw bytes.
  class StreamProtocol < Protocol
    # @param discard_leading_bytes [Integer] The number of bytes to discard
    #   from the binary data after reading from the stream. Note that this is often
    #   used to remove a sync pattern from the final packet data.
    # @param sync_pattern [String] String representing a hex number ("0x1234")
    #   that will be searched for in the raw stream. Bytes encountered before
    #   this pattern is found are discarded.
    # @param fill_fields [Boolean] Fill any required fields when writing packets
    def initialize(discard_leading_bytes = 0, sync_pattern = nil, fill_fields = false)
      super()
      @discard_leading_bytes = discard_leading_bytes.to_i
      @sync_pattern = ConfigParser.handle_nil(sync_pattern)
      @sync_pattern = @sync_pattern.hex_to_byte_string if @sync_pattern
      @fill_fields = ConfigParser.handle_true_false(fill_fields)
    end

    def reset
      super()
      @data = ''
      @data.force_encoding('ASCII-8BIT')
      @sync_state = :SEARCHING
    end

    # Reads from the stream. It can look for a sync pattern before
    # creating a Packet. It can discard a set number of bytes at the beginning
    # of the stream before creating the Packet.
    #
    # @return [String|nil] Data for a packet consisting of the bytes read from the
    #   stream.
    def read_data(data)
      @data << data

      control = handle_sync_pattern()
      return control if control

      # Reduce the data to a single packet
      packet_data = reduce_to_single_packet()
      return packet_data if Symbol === packet_data
      @sync_state = :SEARCHING

      # Discard leading bytes if necessary
      packet_data.replace(packet_data[@discard_leading_bytes..-1]) if @discard_leading_bytes > 0
      packet_data
    end

    # Called to perform modifications on a command packet before it is sent
    #
    # @param packet [Packet] Original packet
    # @return [Packet] Potentially modified packet
    def write_packet(packet)
      # If we're filling the sync pattern and the sync pattern is part of the
      # packet (since we're not discarding any leading bytes) then we have to
      # fill the sync pattern in the actual packet so do it here.
      if @fill_fields && @sync_pattern && @discard_leading_bytes == 0
        # Directly write the packet buffer and fill in the sync pattern
        BinaryAccessor.write(@sync_pattern, 0, @sync_pattern.length * 8, :BLOCK,
                             packet.buffer(false), :BIG_ENDIAN, :ERROR)
      end
      packet
    end

    # Called to perform modifications on write data before sending it to the stream
    #
    # @param data [String] Raw packet data
    # @return [String] Potentially modified packet data
    def write_data(data)
      # If we're filling the sync pattern and discarding the leading bytes
      # during a read then we need to put them back during a write.
      # If we're discarding the bytes then by definition they can't be part
      # of the packet so we just modify the data.
      if @fill_fields && @discard_leading_bytes > 0
        data = ("\x00" * @discard_leading_bytes) << data
        if @sync_pattern
          BinaryAccessor.write(@sync_pattern, 0, @sync_pattern.length * 8, :BLOCK,
                               data, :BIG_ENDIAN, :ERROR)
        end
      end
      super(data)
    end

    # @return [Boolean] control code (nil, :STOP)
    def handle_sync_pattern
      if @sync_pattern and @sync_state == :SEARCHING
        loop do
          # Make sure we have some data to look for a sync word in
          return :STOP if @data.length < @sync_pattern.length

          # Find the beginning of the sync pattern
          sync_index = @data.index(@sync_pattern.getbyte(0).chr)
          if sync_index
            # Make sure we have enough data for the whole sync pattern past this index
            return :STOP if @data.length < (sync_index + @sync_pattern.length)

            # Check for the rest of the sync pattern
            found = true
            index = sync_index
            @sync_pattern.each_byte do |byte|
              if @data.getbyte(index) != byte
                found = false
                break
              end
              index += 1
            end

            if found
              if sync_index != 0
                discard_length = @data[0..(sync_index - 1)].length
                log_discard(discard_length, true)
                # Delete Data Before Sync Pattern
                @data.replace(@data[sync_index..-1])
              end
              @sync_state = :FOUND
              return nil

            else # not found
              log_discard(@data[0..sync_index].length, false)
              # Delete Data Before and including first character of suspected sync Pattern
              @data.replace(@data[(sync_index + 1)..-1])
              next
            end # if found

          else # sync_index = nil
            log_discard(@data.length, false)
            @data.replace('')
            return :STOP
          end # unless sync_index.nil?
        end # end loop
      end # if @sync_pattern
      nil
    end

    def log_discard(length, found)
      Logger.error("Sync #{'not ' unless found}found. Discarding #{length} bytes of data.")
      if @data.length >= 0
        Logger.error(sprintf("Starting: 0x%02X 0x%02X 0x%02X 0x%02X 0x%02X 0x%02X\n",
          @data.length >= 1 ? @data.getbyte(0) : 0,
          @data.length >= 2 ? @data.getbyte(1) : 0,
          @data.length >= 3 ? @data.getbyte(2) : 0,
          @data.length >= 4 ? @data.getbyte(3) : 0,
          @data.length >= 5 ? @data.getbyte(4) : 0,
          @data.length >= 6 ? @data.getbyte(5) : 0))
      end
    end

    def reduce_to_single_packet
      # Reduce to packet data and clear data for next packet
      packet_data = @data.clone
      @data.replace('')
      packet_data
    end
  end
end
