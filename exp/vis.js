fetch('../data.json').then(response => response.json()).then(vis);

// quantitative variables: numPages, avgRating, ratingsCount
// ordinal variable : yearPublication

function vis(data) {

    console.log(data);

    const chart = new Chart('.vis-container', '.vis', data);

    console.log(chart);

    const r = 4;

    const margin = 100;
    const x = d3.scaleLinear().range([margin/4, chart.w - margin]).domain([1,5]);

    // sim
    const sim = d3.forceSimulation();
    function prepares_sim() {

        const strength = 0.04;
    
        let flag = false;
    
        sim
          //.velocityDecay(0.3)
          .force('x', d3.forceX().strength(strength*1.5).x(d => x(d.avgRating)))
          .force('y', d3.forceY().strength(strength).y(chart.h/2))
          .force('collision', d3.forceCollide().strength(strength*2.5).radius(5))
          //.alphaMin(0.01)
          .on('tick', update_positions)
          .on('end', save_last_positions)
          .stop()
        ;

        sim.nodes(data);
    
    }

    prepares_sim();

    // initial
    d3.select(chart.el)
      .selectAll('img.book')
      .data(data)
      .join('img')
      .classed('book', true)
      .style('left', 0)
      .style('top', 0)
      .style('transform', (d,i) => {

        d.x = (i % nx) * book_w;
        d.y = (Math.floor(i / nx) * book_h);
        
        return `translate(${d.x}px, ${d.y}px)`
      })
      //.style('left', (d,i) => ((i % nx) * book_w) + 'px' )
      //.style('top', (d,i) => ((Math.floor(i / nx) * book_h)) + 'px')
      .attr('src', d => '../imgs/' + d.filename)
      .style('width', book_w + 'px')
      .style('height', book_h + 'px')
    ;

    const data_sorted_numPages = [...data].sort((a,b) => b.numPages - a.numPages);
    console.log(data_sorted_numPages);

    const hierarc_data = {
        children: data_sorted_numPages
    }

    const pagesTreemap = d3.treemap()
      .tile(d3.treemapBinary)
      .size([chart.w, chart.h])
      .round(true)
      (d3.hierarchy(hierarc_data).sum(d => d.numPages))
    ;

    console.log(pagesTreemap, pagesTreemap.leaves());


    function update_positions() {

        const l = 10;
        const scale_x = l / book_w;
        const scale_y = l / book_h;

        d3.selectAll('img.book')
          .style('transform', d => `translate(${d.x}px, ${d.y}px) scale(${scale_x}, ${scale_y})`)

    }



    function save_last_positions() {
        console.log('uh.')
    }


    console.log(data);

    const btns = document.querySelector('.controls');
    btns.addEventListener('click', fire);

    function fire(e) {

        if (e.target.tagName == 'BUTTON') {

            const action = e.target.dataset.action;

            if (action == 'treemap') transition_to_treemap();
            if (action == 'squares') transition_to_squares();
            if (action == 'force') transition_to_force();

        } else {

            console.log('no button no');

        }

          
    }

    function transition_to_treemap() {

        d3.selectAll('img.book')
          .transition()
          .delay((d,i) => (i % 8) * 100)
          .duration(1000)
          .style('transform', d => {

            const book_data_from_hierarchy = pagesTreemap.children.filter(b => b.data.url == d.url)[0];

            const new_w = book_data_from_hierarchy.x1 - book_data_from_hierarchy.x0;
            const new_h = book_data_from_hierarchy.y1 - book_data_from_hierarchy.y0;

            //const translate_x = book_data_from_hierarchy.x0 - ((i % nx) * book_w);
            //const translate_y = book_data_from_hierarchy.y1 - (Math.floor(i / nx) * book_h);

            const translate_x = book_data_from_hierarchy.x0;
            const translate_y = book_data_from_hierarchy.y0;

            //update positions to sim parameters
            d.x = translate_x;
            d.y = translate_y;

            const scale_x = new_w / book_w;
            const scale_y = new_h / book_h;

            if (d.title == 'Jonathan Strange & Mr Norrell') {
                console.log(new_w, new_h, book_data_from_hierarchy.x0, book_data_from_hierarchy.y0)
            }

            return `translate(${translate_x}px, ${translate_y}px) scale(${scale_x}, ${scale_y})`;
          })
        ;

    }

    function transition_to_squares() {

        const l = 10;

        d3.selectAll('img.book')
          .transition()
          .delay((d,i) => (i % 8) * 100)
          .duration(1000)
          .style('transform', d => {

            const scale_x = l / book_w;
            const scale_y = l / book_h;

            d.x = x(d.avgRating);
            d.y = 300;

            return `translate(${x(d.avgRating)}px, 300px) scale(${scale_x}, ${scale_y})`;

          })

    }

    function transition_to_force() {

        console.log('force!');

        d3.selectAll('img.book')
          .transition()
          .delay((d,i) => (i % 8) * 40)
          .duration(400)
          .style('transform', d => {

            const l = 10;

            const scale_x = l / book_w;
            const scale_y = l / book_h;

            return `translate(${d.x}px, ${d.y}px) scale(${scale_x}, ${scale_y})`;

          })

        setTimeout( () => sim.alpha(1).restart(), 2000);

    }

    function updates_sim_param() {
        data.forEach()
    }




}

class Chart {

    container;
    el;
    w;
    h;

    data;

    margin = 100;

    constructor(container, el, data) {

        this.container = container;
        this.el = el;
        this.data = data;

        const cont = document.querySelector(container);

        this.w = window.getComputedStyle(cont).width.slice(0,-2);
        this.h = window.getComputedStyle(cont).height.slice(0,-2);

        this.scalesParams.set(this);

    }

    scalesParams = { 
        
        ranges : {

           x : null, 
           y : null

        },

        domains : {

            numPages : null,
            avgRating : null,
            ratingsCount : null,

            year_publication : null

        },

        set(ref) {

            const data = ref.data;

            ref.scalesParams.domains.numPages = [0, Math.max( ...data.map(d => d.numPages) ) ];
            ref.scalesParams.domains.ratingsCount = [0, Math.max( ...data.map(d => d.ratingsCount) ) ];
            ref.scalesParams.domains.avgRating = [0, 5];
            ref.scalesParams.domains.year_publication = d3.extent(data, d => d.year_publication);

            ref.scalesParams.ranges.x = [ref.margin, ref.w - ref.margin];
            ref.scalesParams.ranges.y = [ref.h - ref.margin, ref.margin];

        }
    }

}