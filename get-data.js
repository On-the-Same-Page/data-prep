const books = document.querySelectorAll('[itemtype="http://schema.org/Book"]');

const url = books[0].querySelector('[itemprop="url"]').href;
const rank = books[0].querySelector('[valign="top"]').innerText;
const info = books[0].querySelector('.bookRatingAndPublishing').innerText;
const score = books[0].querySelector('[onclick*="score_explanation"]').innerText;
const votes = books[0].querySelector('[id*="loading_link"]').innerText;

function trigger_tooltips() {

    const m_over = new Event('mouseover');
    //const m_out = new Event('mouseout');

    const books = document.querySelectorAll('[itemtype="http://schema.org/Book"]');

    books.forEach(book => {

        const tt_trigger = book.querySelector('.js-tooltipTrigger');

        tt_trigger.dispatchEvent(m_over);
        //tt_trigger.dispatchEvent(m_out);
    
        // this info only appears after we have hoovered over the book cover (actually a wrapping div with the class js-tooltipTrigger). That's way we are dispatching these events of mouseover in the beginning, so that the HTML element we want is populated by javascript. In the end, we send a "mouse out"
        // thankfully, dispatchEvent is SYNCHRONOUS.


    })

}

//localStorage.setItem('out', [])

function get_data() {



    const books = document.querySelectorAll('[itemtype="http://schema.org/Book"]');

    const data = Array.from(books).map(book => {

        const url = book.querySelector('[itemprop="url"]').href;
        const rank = book.querySelector('[valign="top"]').innerText;
        const info = book.querySelector('.bookRatingAndPublishing').innerText;
        const score = book.querySelector('[onclick*="score_explanation"]').innerText;
        const votes = book.querySelector('[id*="loading_link"]').innerText;

        return { url, rank, info, score, votes }

    })

    const current_data = JSON.parse(window.localStorage.getItem('out'));
    const new_data = [...current_data, ...data];
    window.localStorage.setItem('out', JSON.stringify(new_data));

}