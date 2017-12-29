require 'smarter_csv'
require 'json'
require 'fileutils'

# This takes a csv file and converts in into individual json files.
# It limits the number of files due to limits in the trial version 
# of the Watson Discovery Service.
# Note that this script will fail for 2 common reasons:
# 1 - old Ruby version (requires >= 2.4.2)
# 2 - bad entry found in the csv file 

options = {
  :remove_empty_values => false,
  :encoding => 'ISO-8859-1',
  :key_mapping => {
    :listing_name => :title,
    :comments => :text
  }
}

max_files = 2000
FileUtils.mkdir_p('data')
puts 'MakeDir'
index = 0
puts index
records = SmarterCSV.process('austin-2015-11-07-reviews.csv', options)
records.each do |record|
  puts index
  # unless record[:text].to_s.strip.empty?
  if !record[:text].to_s.strip.empty? and index<max_files
    index += 1
    filename = (index).to_s.rjust(3, "0")
    File.open("data/#{filename}.json", 'a') do |w|
      w.puts JSON.pretty_generate(record)
    end
  end
end