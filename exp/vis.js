fetch('../data.json').then(response => response.json()).then(vis);

const cont = document.querySelector('.vis-container');
let a = d3.select(cont);
console.log(a);


// quantitative variables: numPages, avgRating, ratingsCount
// ordinal variable : yearPublication

function vis(data) {

    console.log(data);

    const chart = new Chart('.vis-container', '.vis', data);
    const sim = new Simulation(data, chart);

    console.log(chart);

    sim.restart();

    function save_last_positions() {
        console.log('uh.')
    }

    function move1() {

        chart.scales.set(chart, 'avgRating', 'y');
        chart.scales.set(chart, 'year_publication', 'x');

        if (!chart.axis.el_x) {
            chart.axis.build(chart);
        } else {
            chart.axis.update(chart);
        }

        const strength = sim.strength;

        sim.sim
        .force('x', d3.forceX().strength(strength/2).x(d => chart.scales.x(d.year_publication)))
        .force('y', d3.forceY().strength(strength/2).y(d => chart.scales.y(d.avgRating)));

        sim.restart();

    }

    function move2() {

        chart.scales.set(chart, 'ratingsCount', 'y');
        chart.scales.set(chart, 'year_publication', 'x');

        if (!chart.axis.el_x) {
            chart.axis.build(chart);
        } else {
            chart.axis.update(chart);
        }

        const strength = sim.strength;

        sim.sim
        .force('x', d3.forceX().strength(strength/2).x(d => chart.scales.x(d.year_publication)))
        .force('y', d3.forceY().strength(strength/2).y(d => chart.scales.y(d.ratingsCount)));

        sim.restart();

    }


    console.log(data);

    const btns = document.querySelector('.controls');
    btns.addEventListener('click', fire);

    function fire(e) {

        if (e.target.tagName == 'BUTTON') {

            const action = e.target.dataset.action;

            if (action == 'force1') move1();
            if (action == 'force2') move2();
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

    function updates_sim_param() {
        data.forEach()
    }




}

class Chart {

    ref_container;
    ref_svg;

    svg;

    w;
    h;
    r = 4;

    margin = 100;

    data;

    marks;

    constructor(ref_container, ref_svg, data) {

        this.ref_container = ref_container;
        this.ref_svg = ref_svg;
        this.data = data;

        const cont = document.querySelector(ref_container);
        const svg = d3.select(ref_svg);
        this.svg = svg;

        this.w = window.getComputedStyle(cont).width.slice(0,-2);
        this.h = window.getComputedStyle(cont).height.slice(0,-2);

        svg.attr('viewBox', `0 0 ${this.w} ${this.h}`);

        this.scalesParams.set(this);

        this.createMarks();

    }

    createMarks() {

        this.marks = this.svg
          .selectAll('circle.book')
          .data(this.data)
          .join('circle')
          .classed('book', true)
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', this.r)
          .attr('transform', d => {
            
            d.x = Math.random() * this.w;
            d.y = Math.random() * this.h;
            
            return `translate(${d.x}, ${d.y})`
          })
        ;

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

    scales = {

        x : d3.scaleLinear(),
        y : d3.scaleLinear(),

        set(ref, variable, dimension) {

            ref.scales[dimension]
              .range( ref.scalesParams.ranges[dimension])
              .domain( ref.scalesParams.domains[variable])
            ;

        }
    }

    axis = {

        x: null,
        y: null,

        el_x: null,
        el_y: null,

        set(ref) {

            ref.axis.x = d3.axisBottom(ref.scales.x);
            ref.axis.y = d3.axisLeft(ref.scales.y);

        },

        build(ref) {

            ref.axis.set(ref);

            ref.axis.el_x = ref.svg.append('g')
              .classed('axis', true)
              .classed('axis-x', true)
              .attr('transform', `translate(0,${ref.scalesParams.ranges.y[0]})`)
              .call(ref.axis.x)
            ;

            ref.axis.el_y = ref.svg.append('g')
              .classed('axis', true)
              .classed('axis-y', true)
              .attr('transform', `translate(${ref.margin}, 0)`)
              .call(ref.axis.y)
          ;

        },

        update(ref) {

            ref.axis.set(ref);

            ref.axis.el_x.transition().duration(500).call(ref.axis.x);
            ref.axis.el_y.transition().duration(500).call(ref.axis.y);

        }

    }

}

class Simulation {

    sim;

    chart_ref;

    strength = 0.06;

    constructor(data, chart) {

        this.chart_ref = chart;
        console.log(this.chart_ref);
        
        this.sim = d3.forceSimulation();
        this.sim.nodes(data);
        this.set(chart);

    }

    set(chart) {

        const strength = this.strength;
    
        this.sim
          .velocityDecay(0.3)
          .force('x', d3.forceX().strength(strength/2).x(chart.w/2))
          .force('y', d3.forceY().strength(strength/2).y(chart.h/2))
          .force('collision', d3.forceCollide().strength(strength*4).radius(chart.r))
          .alphaMin(0.05)
          .on('tick', this.update)
          .on('end', this.savePositions)
          .stop()
        ;
    
    }

    update() {

        const chart = this.chart_ref;

        //console.log(chart);
    
        //chart.marks
        d3.selectAll('.book')
          .attr('transform', d => `translate(${d.x}, ${d.y})`)
    }

    restart() {

        this.sim.alpha(1).restart()

    }

}