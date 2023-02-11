library(tidyverse)
library(jsonlite)

library(extrafont)
loadfonts()

raw <- stream_in(file('./raw-data/books.jl'))

additional_data_raw <- jsonify::from_json('additional-data.json')

additional_data <- additional_data_raw %>%
  mutate(
    rank = as.numeric(rank),
    year_publication = as.numeric(str_sub(info, -4, -1)),
    list_score = stringr::str_remove(score, "score: "),
    list_score = as.numeric(str_replace_all(list_score, ',', '')),
    number_votes = stringr::str_remove(votes, " people voted"),
    number_votes = as.numeric(str_replace_all(number_votes, ',', ''))
  ) %>%
  filter(!is.na(year_publication))

data_pre <- raw %>%
  left_join(additional_data, by = 'url')

# Counts Genres
genres_super_list <- c(NULL)
max_nr_genres <- 0

for (book_genres in data_pre$genres) {
  
  genres_super_list <- c(genres_super_list, book_genres)
  
  nr_genres <- length(book_genres)
  max_nr_genres <- max(max_nr_genres, nr_genres)
  
}

genres_count <- data.frame(genres = genres_super_list) %>%
  count(genres) %>%
  mutate(pct = n / nrow(data_pre))

# Adds genres variables as booleans
genres_list <- genres_count %>% filter(pct >= .1) %>% select(genres) %>% unlist()

data_genres <- data_pre

for (i in 1:nrow(data_genres)) {
  
  data_genres[i, 'genres_list'] = data_genres[1,'genres'] %>% unlist() %>% paste(collapse = ', ')
  
  for (genre in genres_list) {
    
    data_genres[i, genre] = genre %in% unlist(data_genres[i, 'genres'])
    
  }
  
}
  

theme_charts <- theme_minimal() +
  theme(
    text = element_text(family = 'Fira Code')
  )

ggplot(genres_count %>% filter(pct > .05),
       aes(x = pct, y = reorder(genres, n))) + 
  geom_col(width = .75, fill = 'steelblue') +
  geom_text(aes(label = scales::percent(pct, accuracy = .1)), 
            hjust = 'left', nudge_x = .005, family = 'Fira Code', size = 3) +
  labs(y = NULL, x = NULL, title = 'Percentage of books tagged with a given genre') +
  scale_x_continuous(labels = scales::percent, expand = expansion(add = c(0,.1))) +
  theme_charts +
  theme(
    panel.grid.major.y = element_blank()
  )

