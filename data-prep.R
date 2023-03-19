library(tidyverse)
library(jsonlite)

library(extrafont)
loadfonts()

theme_charts <- theme_minimal() +
  theme(
    text = element_text(family = 'Fira Code')
  )

raw <- stream_in(file('./raw-data/books.jl'))

additional_data_raw <- jsonify::from_json('additional-data.json')

additional_data <- additional_data_raw %>%
  mutate(
    rank = as.numeric(rank),
    year_publication = as.numeric(str_sub(info, -4, -1)),
    list_score = stringr::str_remove(score, "score: "),
    list_score = as.numeric(str_replace_all(list_score, ',', '')),
    number_votes = stringr::str_remove(votes, " people voted"),
    number_votes = as.numeric(str_replace_all(number_votes, ',', '')),
    info = str_replace(info, '\n', ''), 
    avg_rating = str_sub(info,
                         start = str_locate(info, 'avg')[1] - 5,
                         end = str_locate(info, 'avg')[1] - 2),
    avg_rating_no = as.numeric(str_trim(avg_rating))
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
  
  data_genres[i, 'genres_list'] = data_genres[i,'genres'] %>% unlist() %>% paste(collapse = ', ')
  data_genres[i, 'authors_list'] = data_genres[i,'author'] %>% unlist() %>% paste(collapse = ', ')
  data_genres[i, 'series_list'] = data_genres[i,'series'] %>% unlist() %>% paste(collapse = ', ')
  data_genres[i, 'places_list'] = data_genres[i,'places'] %>% unlist() %>% paste(collapse = ', ')
  data_genres[i, 'awards_list'] = data_genres[i,'awards'][[1]][['name']] %>% unlist() %>% paste(collapse = ', ')
  
  for (genre in genres_list) {
    
    data_genres[i, genre] = genre %in% unlist(data_genres[i, 'genres'])
    
  }
  
  # ratings
  ratings <- unlist(data_genres[i, 'ratingHistogram'])
  
  w_rating <- 0
  total_ratings <- 0
  
  for (r in 1:length(ratings)) {
    w_rating <- w_rating + r * ratings[r]
    total_ratings <- total_ratings + ratings[r]
  }
  
  data_genres[i, 'avgRating'] = w_rating / total_ratings
  
}

data_clean <- data_genres %>%
  mutate(
    avgRating = round(avgRating, digits = 2)
  ) %>%
  select(-genres, -author, -publishDate, -characters, -ratingHistogram, -info, -score, -votes, -avg_rating, -avg_rating_no, -places, -awards, -series)

# test
# sum(round(data_genres$avgRating - data_genres$avg_rating_no,0), na.rm = T)

#write.csv(data_clean, 'data.csv', fileEncoding = 'utf-8')
#write.csv(genres_count, 'genres.csv', fileEncoding = 'utf-8')


# Superdata ---------------------------------------------------------------

list_of_genres <- c('Fantasy', 'Romance', 'Mystery', 'Historical Fiction', 'Science Fiction', 'Thriller')

super_data <- list()

generate_mini_dataset_genre <- function(genre) {
  
  df <- data_clean %>% 
    filter(.data[[genre]]) %>% select(avgRating, numPages, ratingsCount, year_publication) %>%
    mutate(genre = genre)
  print(genre)
  print(tail(df))
  
  return(df)
  
}

super_data <- purrr::map(list_of_genres, generate_mini_dataset_genre)

super_df <- bind_rows(super_data)

ggplot(super_df, aes(x = avgRating, y = genre, color = genre)) + 
  ggbeeswarm::geom_quasirandom(groupOnX = FALSE, alpha = .4, shape = 16) +
  geom_boxplot(color = 'black', fill = 'transparent') + 
  #scale_x_continuous(limits = c(0, 2000)) +
  labs(y = NULL, x = 'Average Rating') +
  theme_charts + theme(legend.position = 'none')

ggplot(super_df, aes(x = numPages, y = genre, color = genre)) + 
  ggbeeswarm::geom_quasirandom(groupOnX = FALSE, alpha = .4, shape = 16) +
  geom_boxplot(color = 'black', fill = 'transparent') + 
  scale_x_continuous(limits = c(0, 2000)) +
  labs(y = NULL, x = 'Number of Pages') +
  theme_charts + theme(legend.position = 'none')

ggplot(super_df, aes(x = ratingsCount, y = genre, color = genre)) + 
  ggbeeswarm::geom_quasirandom(groupOnX = FALSE, alpha = .4, shape = 16) +
  geom_boxplot(color = 'black', fill = 'transparent') + 
  scale_x_log10() +
  labs(y = NULL, x = 'Number of ratings (log)') +
  theme_charts + theme(legend.position = 'none')

ggplot(super_df, aes(x = year_publication, y = genre, color = genre)) + 
  ggbeeswarm::geom_quasirandom(groupOnX = FALSE, alpha = .4, shape = 16) +
  geom_boxplot(color = 'black', fill = 'transparent') + 
  scale_x_continuous(limits = c(1970,NA)) +
  labs(y = NULL, x = 'Publication year') +
  theme_charts + theme(legend.position = 'none')

genres_summary <- super_df %>%
  count(genre, year_publication)

ggplot(genres_summary, aes(x = year_publication, y = n, fill = genre)) + geom_col() +
  scale_x_continuous(limits = c(1900,NA)) +
  facet_wrap(~genre) +
  labs(x = "Publication year", y = "Number of books") +
  theme_charts + theme(legend.position = 'none')

# Exploration -------------------------------------------------------------

ggplot(genres_count %>% filter(pct >= .05),
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

ggplot(data_genres %>% filter(rank <= 1000), aes(x = ratingsCount, y = numPages)) + geom_point(alpha = .3, shape = 16) +
  theme_charts

ggplot(data_genres, aes(x = ratingsCount)) + 
  geom_histogram(fill = "goldenrod", bins = 100) +
  scale_x_log10() +
  labs(x = "Number of ratings (log)", title = 'Distribution of the books according to the number of ratings',
       y = NULL) +
  theme_charts

ggplot(data_genres, aes(x = year_publication)) + 
  geom_histogram(fill = "goldenrod", binwidth = 1) +
  scale_x_continuous(limits = c(1900,NA)) +
  labs(x = "Publication year", title = 'Distribution of the books according to publication year',
       y = NULL, subtitle = 'Considering only books published after 1900') +
  theme_charts

ggplot(data_genres %>% filter(#rank <= 1000, 
  year_publication >= 1900), aes(y = ratingsCount, x = year_publication)) + 
  geom_point(alpha = .4, shape = 16, color = 'hotpink') +
  scale_y_log10(labels = scales::comma_format(big.mark = '.')) +
  labs(x = "Year of publication", title = 'Number of ratings for each book according to the year of publication',
       y = "Number of ratings (log)", subtitle = 'Considering only books published after 1900') +
  theme_charts

ggplot(data_genres %>% filter(#rank <= 1000, 
  year_publication >= 1900), aes(y = numPages, x = year_publication)) + 
  geom_point(alpha = .4, shape = 16, color = 'hotpink') +
  scale_y_log10(labels = scales::comma_format(big.mark = '.')) +
  labs(x = "Year of publication", title = 'Number of pages x year of publication',
       y = NULL, subtitle = 'Considering only books published after 1900') +
  theme_charts

ggplot(data_genres %>% filter(#rank <= 1000, 
  year_publication >= 1900), aes(y = avgRating, x = year_publication)) + 
  geom_point(alpha = .3, shape = 16, color = 'hotpink') +
  scale_y_continuous(labels = scales::comma_format(big.mark = '.'), limits = c(1,5)) +
  labs(x = "Year of publication", title = 'Average rating for each book according to the year of publication',
       y = NULL, subtitle = 'Considering only books published after 1900') +
  theme_charts

ggplot(data_genres, aes(y = avgRating, x = ratingsCount)) + 
  geom_point(alpha = .4, shape = 16, color = 'hotpink') +
  scale_y_continuous(labels = scales::comma_format(big.mark = '.'), limits = c(1,5)) +
  scale_x_log10() +
  labs(x = "Number of ratings (log)", title = 'Average rating for each book according to the number of ratings',
       y = NULL) +
  theme_charts

ggplot(data_genres %>% filter(#rank <= 1000, 
  year_publication >= 1900), aes(y = avgRating, x = year_publication, color = Fantasy)) + 
  geom_point(alpha = .9, shape = 16) +
  scale_y_continuous(labels = scales::comma_format(big.mark = '.'), limits = c(1,5)) +
  labs(x = "Year of publication", title = 'Average rating for each book each book according with the year of publication',
       y = NULL, subtitle = 'Highlighting Fantasy books. Considering only books published after 1900') +
  scale_color_manual(values = c("TRUE" = 'tomato', "FALSE" = '#dedede')) +
  theme_charts +
  theme(legend.position = 'none')

ggplot(data_genres, aes(x = avgRating, y = Fantasy)) + 
  geom_boxplot() + 
  ggbeeswarm::geom_quasirandom(groupOnX = FALSE, color = 'hotpink', alpha = .6) +
  theme_charts



# awards ------------------------------------------------------------------

data_awards <- data_clean

awards_of_interest <- c('Pulitzer', 'Booker', 'Hugo', 'Nebula', 'National Book Award')

for (award in awards_of_interest) {
  data_awards[,award] = str_detect(data_awards$awards_list, award)
}

genre_buttons <- c('Science Fiction', 'Historical Fiction', 'Thriller', 'Mystery', 'Romance', 'Fantasy', 'Nonfiction')

data_main <- data_awards

for (row in 1:nrow(data_main)) {
  
  one_of_the_genres <- FALSE
  
  for (genre in genre_buttons) {
    
    one_of_the_genres <- one_of_the_genres | data_main[row, genre]
    
    if (one_of_the_genres) break
    
  }
  
  data_main[row, 'Other'] = !one_of_the_genres
}

summary_main_genres <- data_main %>%
  select(any_of(c(genre_buttons, 'Other'))) %>%
  group_by() %>%
  summarise_all(sum) %>%
  ungroup() %>%
  mutate_all(.funs=~./5000) %>%
  gather(key = "genres", value = "pct")

ggplot(summary_main_genres, aes(x = pct, y = reorder(genres, pct))) + geom_col()

# top 1000 -----------------------------------------------------------------

pre_top1000 <- data_main %>% filter(rank <= 1000)

covers <- readRDS('img-filenames-table.rds') %>% filter(!is.na(imageUrl))

top1000 <- pre_top1000 %>% inner_join(covers, by = 'imageUrl') %>% filter(!is.na(filename))

# cleanup -----------------------------------------------------------------
top1000 %>% filter(!stringi::stri_enc_isascii(title)) %>% select(title)

top1000[which(top1000$url=="https://www.goodreads.com/book/show/646462._"),'title'] = "The Qur'an"

problematic_titles_urls <- c(
  'https://www.goodreads.com/book/show/40941582', 
  'https://www.goodreads.com/book/show/30528544',
  'https://www.goodreads.com/book/show/30528535',
  'https://www.goodreads.com/book/show/40937505',
  'https://www.goodreads.com/book/show/1375.The_Iliad_The_Odyssey')

top1000 <- top1000 %>%
  filter(!(url %in% problematic_titles_urls))

oldies <- top1000 %>% arrange(year_publication) %>% 
  filter(row_number() < 100) %>% 
  select(title, single_author, authors_list, url, year_publication)

# ggplot(top1000) + geom_boxplot(aes(y = 1, x = numPages))
# ggplot(top1000) + geom_boxplot(aes(y = 1, x = avgRating))
# ggplot(top1000) + geom_boxplot(aes(y = 1, x = year_publication))
# 
# ggplot(top1000) + geom_point(aes(x = year_publication, y = ratingsCount))
# 
# library(treemap)
# treemap(top1000, index="title", vSize="numPages", type = "index")
# treemap(top1000, index="title", vSize="ratingsCount", type = "index")


# opening - grid 1---------------------------------------------------------

library(readxl)
grid1 <- read_excel('Athousandbooks-grid.xlsx') %>%
  as.data.frame()


grid2 <- read_excel('OntheSamePAge-grid-rebutchered.xlsx') %>%
  as.data.frame()

get_grid_positions <- function(grid) {
  
  positions <- data.frame()
  n <- 0
  
  for (i in 1:nrow(grid)) {
    
    for (j in 1:ncol(grid)) {
      
      if (!is.na(grid[i,j])) {
        
        positions[n+1, 'n'] <- n
        positions[n+1, 'pos_i'] <- j - 1
        positions[n+1, 'pos_j'] <- i - 1
        n <- n + 1
        
      }
    }
  }
  
  return(positions)
  
  
}

pos1 <- get_grid_positions(grid1)
pos2 <- get_grid_positions(grid2)

#max_j <- max(positions$pos_j)

#ggplot(positions, aes(x = pos_i, y = max_j-pos_j)) + geom_point()

book_covers_files <- dir('./imgs/')

data_with_covers <- top1000 %>%
  filter(filename %in% book_covers_files) %>%
  arrange(rank) #%>%
  #filter(row_number() <= nrow(positions)) # (1)
# --
# (1) Getting only the first n books, where n is the number of "pixels" that were necessary to create the "On the Same Page" art

pos1 <- bind_rows(pos1, pos1) %>% filter(row_number() <= nrow(data_with_covers))
pos2 <- bind_rows(pos2, pos2) %>% filter(row_number() <= nrow(data_with_covers))

data_with_covers$pos1_i <- pos1$pos_i
data_with_covers$pos1_j <- pos1$pos_j
data_with_covers$pos2_i <- pos2$pos_i
data_with_covers$pos2_j <- pos2$pos_j


# write data out ----------------------------------------------------------

write_rds(data_with_covers, 'data_with_covers.rds')
jsonlite::write_json(data_with_covers, path = 'data.json')


# plots, more -------------------------------------------------------------

library(GGally)

data_par_coord <- data_with_covers %>% select(title, ratingsCount, numPages, avgRating, year_publication, )
write.csv(data_par_coord, 'parcoord.csv')

par(bg = "white")
plot(data_par_coord %>% select(-title) , pch=20 , cex=.4 , col="tomato")

p<-ggparcoord(data = data_par_coord, order = 'Convex' , columns = 1:4)
