library(magick)

data <- readRDS('data_with_covers.rds')

files <- data$filename

actual_files <- dir('./imgs/')

for (file in files) {
  
  if (file %in% actual_files) {
    
    img <- magick::image_read(paste0('./imgs/', file))
    converted_img <- magick::image_resize(img, geometry = 200)
    magick::image_write(converted_img, paste0('./imgs/output/', file))
    
  }
  
}

#file <- magick::image_read("./imgs/book0001.jpg")
#out <- magick::image_resize(file, geometry = 200)

a<- dir('./imgs/output')

# had an error with file book0799.jpg, got it from Amazon instead
# magick::image_read('./imgs/book0799.jpg')
