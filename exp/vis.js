fetch('../data.json').then(response => response.json()).then(vis);

const cont = document.querySelector('.vis-container');
let a = d3.select(cont);
console.log(a);


// quantitative variables: numPages, avgRating, ratingsCount
// ordinal variable : yearPublication

function vis(data) {

    console.log(data);

    // make all this instances part of the state object;
    const chart = new Chart('.vis-container', '.vis', data);
    const sim = new Simulation(data, chart, '.use-the-force');
    state.ref_to_sim = sim;
    const axis = new Axis(chart, sim);
    state.ref_to_axis = axis;

    console.log(chart);

    sim.restart();

    console.log(data);

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
          .classed('no-force', true)
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

        variables : {

            numPages : "Page count",
            avgRating : "Average rating",
            ratingsCount : "Number of ratings",
            year_publication : "Publication Year"


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

}

class Axis {

    ref_to_chart = null;
    ref_to_sim = null;

    x = null;
    y = null;

    el_x = null;
    el_y = null;

    current_variable_x = null;
    current_variable_y = null;

    selector_variable_x = "#sel-x-variable";
    selector_variable_y = "#sel-y-variable";

    el_sel_x = null;
    el_sel_y = null;

    x_variable = null;
    y_variable = null;

    constructor(chart, sim) {

        this.ref_to_chart = chart;
        this.ref_to_sim = sim;

        this.el_sel_x = document.querySelector(this.selector_variable_x);
        this.el_sel_y = document.querySelector(this.selector_variable_y);

        this.populate_selectors(chart);
        this.monitor_changes();

    }

    set(chart) {

        this.x = d3.axisBottom(chart.scales.x);
        this.y = d3.axisLeft(chart.scales.y);

    }

    build(chart) {

        this.set(chart);

        this.el_x = chart.svg.append('g')
            .classed('axis', true)
            .classed('axis-x', true)
            .attr('transform', `translate(0,${chart.scalesParams.ranges.y[0]})`)
            .call(this.x)
        ;

        this.el_y = chart.svg.append('g')
            .classed('axis', true)
            .classed('axis-y', true)
            .attr('transform', `translate(${chart.margin}, 0)`)
            .call(this.y)
        ;

    }

    update(chart) {

        this.set(chart);

        this.el_x.transition().duration(500).call(this.x);
        this.el_y.transition().duration(500).call(this.y);

    }

    populate_selectors(chart) {

        const variables = chart.scalesParams.variables;
        const variables_list = Object.keys(variables);

        variables_list.forEach((variable, axis) => {

            const new_option_x = document.createElement('option');

            new_option_x.value = variable;
            new_option_x.innerText = variables[variable];

            this.el_sel_x.appendChild(new_option_x);


            const new_option_y = document.createElement('option');

            new_option_y.value = variable;
            new_option_y.innerText = variables[variable];

            this.el_sel_y.appendChild(new_option_y);

        })

    }

    monitor_changes() {

        this.el_sel_x.addEventListener('change', e => this.change_axis_variable(e, this));
        this.el_sel_y.addEventListener('change', e => this.change_axis_variable(e, this));

    }

    change_axis_variable(e, axis) {

        const visual_variable = e.target.name;
        //y_variable, x_variable
        const data_variable = e.target.value;
        //avgRating, numPages etc.

        axis[visual_variable] = data_variable;

        e.target.querySelector('[value="initial"]').disabled = true;

        //console.log('x_', axis.x_variable, ', y_: ', axis.y_variable, ', ', axis.x_variable && axis.y_variable);

        if (axis.x_variable && axis.y_variable) {

            state.x_variable = axis.x_variable;
            state.y_variable = axis.y_variable;
            
            render(axis.ref_to_chart, axis, axis.y_variable, axis.x_variable, axis.ref_to_sim.force_is_on);

        }



        console.log(visual_variable, data_variable);

    }



}

class Simulation {

    sim;

    force_is_on = false;

    chart_ref;

    strength = 0.06;

    button_ref = null;
    button_el = null;

    constructor(data, chart, button_ref) {

        this.button_el = document.querySelector(button_ref);
        this.button_monitor();

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

    stop() {

        this.sim.stop();

    }

    button_monitor() {

        this.button_el.addEventListener('click', e => this.button_handler(e, this));

    }

    button_handler(e) {

        this.button_el.classList.toggle('clicked');
        this.force_is_on = !this.force_is_on;
        state.force = !state.force;
        render(this.chart_ref, state.ref_to_axis, state.y_variable, state.x_variable, state.force);

    } 

}

const state = {
    x_variable : null,
    y_variable : null,
    force : false,
    ref_to_axis : null,
    ref_to_sim : null
}

function render(chart, axis, y_variable, x_variable, force = false) {

    console.log('me chamaram?');

    // include test to avoid setting up and updating even when the axis are unchanged?
    chart.scales.set(chart, x_variable, 'x');
    chart.scales.set(chart, y_variable, 'y');

    if (!axis.el_x && !axis.el_y) {
        axis.build(chart);
    } else {
        axis.update(chart);
    }

    if (!force) {

        axis.ref_to_sim.stop();

        chart.marks
          .classed('no-force', true)
          .attr('transform', d => {

            // updating d.x and d.y so that there's no jump when alternating between 
            // force movement and transition movement
            
            d.x = chart.scales['x'](d[x_variable])
            d.y = chart.scales['y'](d[y_variable])
            
            return `translate(${d.x}, ${d.y})`

          })

    } else {

        chart.marks
          .classed('no-force', false);

        const strength = state.ref_to_sim.strength;

        //console.log(sim);

        state.ref_to_sim.sim
          .force('x', d3.forceX().strength(strength/2).x(d => chart.scales.x(d[x_variable])))
          .force('y', d3.forceY().strength(strength/2).y(d => chart.scales.y(d[y_variable])))
        ;
      
        state.ref_to_sim.restart();

    }

}