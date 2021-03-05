const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

svg.attr('width', size.w)
    .attr('height', size.h);

const containerG = svg.append('g').classed('container', true);

d3.json('data/data.json')
.then(function(data) {
    console.log(data);

});


function drag(simulation) {
}