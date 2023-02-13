fetch('../data.json').then(response => response.json()).then(vis)

function vis(data) {

    console.log(data);

    const chart = new Chart('.vis-container', '.vis');

    console.log(chart.w);

    const book_w = 40;
    const book_h = 50;

    const nx = Math.floor(chart.w / book_w);

    // initial
    d3.select(chart.el)
      .selectAll('img.book')
      .data(data)
      .join('img')
      .classed('book', true)
      .style('left', (d,i) => ((i % nx) * book_w) + 'px' )
      .style('top', (d,i) => ((Math.floor(i / nx) * book_h)) + 'px')
      .attr('src', d => '../imgs/' + d.filename)
      .style('width', book_w + 'px')
      .style('height', book_h + 'px')
    ;

    




}

class Chart {

    container;
    el;
    w;
    h;

    constructor(container, el) {

        this.container = container;
        this.el = el;
        const cont = document.querySelector(container);

        this.w = window.getComputedStyle(cont).width.slice(0,-2);
        this.h = window.getComputedStyle(cont).height.slice(0,-2);

    }

}