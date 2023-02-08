library(tidyverse)
library(curl)

i <- 1
n <- nrow(raw)

img_urls <- data.frame(imageUrl = raw$imageUrl)
reference <- img_urls

while (i <= n) {
  
  img_url <- reference[i,'imageUrl']
  
  if (is.na(img_url)) {
    print(paste0('#error in ',i, ', NA'))
    i <- i + 1
    next
  }
  
  sequential <- str_pad(i, 4, pad = "0")
  
  file_name <- paste0('book', sequential, '.jpg')
  
  reference[i, 'filename'] <- file_name
  
  curl_download(img_url, destfile = paste0('./imgs/', file_name))
  
  if (i %% 50 == 0) {
    print(paste0('Estou no livro ', i, ', pausando por 0.5s...'))
    Sys.sleep(.5)
  }
  
  i <- i + 1
}

#error in 288, NA
#error in 330, forbidden 403
#error in 408, NA
#error in 595, forbidden 403
#error in 1404, NA
#error in 1839, forbidden 403
#error in 1858, NA
#error in 2296, NA
#error in 2836, NA
#error in 2902, NA
#error in 3510, NA
#error in 3826, NA
#error in 4322, NA
