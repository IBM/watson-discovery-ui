require 'smarter_csv'
require 'json'
require 'fileutils'

options = {
  :remove_empty_values => false,
  :encoding => 'ISO-8859-1',
  :key_mapping => {
    :listing_name => :title,
    :comments => :text
  }
}

FileUtils.mkdir_p('data')
puts 'MakeDir'
index = 0
puts index
records = SmarterCSV.process('new-york-city-2016-02-02-reviews-small-1.csv', options)
records.each do |record|
  puts index
  unless record[:text].to_s.strip.empty?
    index += 1
    filename = (index).to_s.rjust(3, "0")
    File.open("data/#{filename}.json", 'a') do |w|
      w.puts JSON.pretty_generate(record)
    end
  end
end