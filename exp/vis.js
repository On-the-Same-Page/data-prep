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
      .style('left', 0)
      .style('top', 0)
      .style('transform', (d,i) => `translate(${((i % nx) * book_w) + 'px'}, ${((Math.floor(i / nx) * book_h)) + 'px'})`)
      //.style('left', (d,i) => ((i % nx) * book_w) + 'px' )
      //.style('top', (d,i) => ((Math.floor(i / nx) * book_h)) + 'px')
      .attr('src', d => '../imgs/' + d.filename)
      .style('width', book_w + 'px')
      .style('height', book_h + 'px')
    ;

    const hierarc_data = {
        children: data
    }

    const pagesTreemap = d3.treemap()
      .tile(d3.treemapBinary)
      .size([chart.w, chart.h])
      .round(true)
      (d3.hierarchy(hierarc_data.sort((a,b) => a.numPages - b.numPages)).sum(d => d.numPages))
    ;

    //console.log(pagesTreemap, pagesTreemap.leaves());

    const btn = document.querySelector('button');
    btn.addEventListener('click', fire);
    function fire(e) {
        d3.selectAll('img.book')
          .transition()
          .delay((d,i) => (i % 8) * 100)
          .duration(1000)
          .style('transform', (d,i) => {

            const book_data_from_hierarchy = pagesTreemap.children.filter(b => b.title == d.title)[0];

            const new_w = pagesTreemap.children[i].x1 - pagesTreemap.children[i].x0;
            const new_h = pagesTreemap.children[i].y1 - pagesTreemap.children[i].y0;

            //const translate_x = pagesTreemap.children[i].x0 - ((i % nx) * book_w);
            //const translate_y = pagesTreemap.children[i].y1 - (Math.floor(i / nx) * book_h);

            const translate_x = pagesTreemap.children[i].x0;
            const translate_y = pagesTreemap.children[i].y0;

            const scale_x = new_w / book_w;
            const scale_y = new_h / book_h;

            if (d.title == 'Jonathan Strange & Mr Norrell') {
                console.log(new_w, new_h, pagesTreemap.children[i].x0, pagesTreemap.children[i].y0)
            }

            return `translate(${translate_x}px, ${translate_y}px) scale(${scale_x}, ${scale_y})`;
          })
          /*
          .style('left', (d,i) => pagesTreemap.children[i].x0 + 'px')
          .style('top', (d,i) => pagesTreemap.children[i].y0 + 'px')
          .style('width', (d,i) => `${pagesTreemap.children[i].x1 - pagesTreemap.children[i].x0}px`)
          .style('height', (d,i) => `${pagesTreemap.children[i].y1 - pagesTreemap.children[i].y0}px`)
          */
          
    }




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