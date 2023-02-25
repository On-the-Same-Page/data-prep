# Data Preparation for the On the Same Page project

Raw data was scrapped using [GoodreadsScraper](https://github.com/havanagrawal/GoodreadsScraper), which is forked in [this organization](https://github.com/On-the-Same-Page/fork-GoodreadsScraper), in jsonlines format.

Additional data was "scrapped" from the list webpages, using [javascript code](/get-data.js), such as year published, rank in the list, Goodreads score.

check ratings x ranking as ranking decreases (and have fewer votes)

get_book_covers.R

To convert the sizes, with magick:

```bash
for filename in ./*.jpg
do
    convert "${filename}" -resize 200 "size200/${filename}"
done
```

We used R, instead.


private _genreClickedOver$ = new BehaviorSubject<Nullable<Selection>>(null);

public get clickedOverGenre$(): Observable<Nullable<Selection>> {
    return this._genreClickedOver$.asObservable();
}

to-do:

* font adjustments para telas grandes, mudar o que tiver como pixels para rem;
* usar o raio maior para telas maiores

* usar outras listas de livros
* opcao de explorar listas de awards, vencedores (Pullitzer, Booker etc.)
* https://www.goodreads.com/award/show/16-pulitzer-prize
* boolean variables for main awards




