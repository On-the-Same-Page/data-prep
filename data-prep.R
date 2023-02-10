library(tidyverse)
library(jsonlite)

raw <- stream_in(file('./raw-data/books.jl'))

additional_data <- jsonify::from_json('additional-data.json')
