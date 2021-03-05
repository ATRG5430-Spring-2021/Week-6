const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, popData, hexbinPopData;
let radiusScale, projection, hexbin;


svg.attr('width', size.w)
    .attr('height', size.h);

let zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
svg.call(zoom);

Promise.all([
    d3.json('data/maps/us-states.geo.json'),
    d3.csv('data/us_county.csv')
]).then(function (datasets) {
    mapData = datasets[0];
    popData = datasets[1];

    // --------- DRAW MAP ----------
    // creating a group for map paths
    let mapG = containerG.append('g').classed('map', true);

    // defining a projection that we will use
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // defining a geoPath function
    let path = d3.geoPath(projection);

    // adding county paths
    mapG.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', function(d) {
            return path(d);
        });
    
    // --------- DRAW HEXBINS ----------
    popData.forEach(d => {
        let position = projection([d.long, d.lat]);
        if (position) {
            d.position = position;
        }
    });
    popData = popData.filter(d => d.position);
    drawHexbins();
});

function drawHexbins(scale = 1) {
    // defining a hexbin function 
    // that will create bins for us
    hexbin = d3.hexbin()
        .size([size.w, size.h])
        // telling the function about the x-axis
        .x(d => d.position[0])
        // telling the function about the y-axis
        .y(d => d.position[1])
        // telling the function about the size of the bins
        .radius(20/scale);

    // creating bins
    hexbinPopData = hexbin(popData);
    hexbinPopData.forEach(d => {
        // d is an array of all the rows for a bin
        d.meanPopulation = d3.mean(d, e => +e.population);
        d.meanAge = d3.mean(d, e => +e.median_age);
    });

    // size scale for hexbin
    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(hexbinPopData, d => +d.meanPopulation))
        .range([1, 20/scale]);
    // color scale for hexagon's color
    let colorScale = d3.scaleSequential()
        .domain(d3.extent(hexbinPopData, d => d.meanAge))
        .interpolator(d3.interpolatePlasma);

    // creating a group for hexbin
    let hexbinG = containerG.selectAll('g.hexbin').data([1])
        .join('g').classed('hexbin', true);

    // creating the hexagonal paths
    hexbinG.selectAll('path')
        .data(hexbinPopData)
        .join('path')
        .transition()
        .duration(0.2)
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .attr('d', d => hexbin.hexagon(20/scale))
        .style('fill', d => colorScale(d.meanAge));
}

function zoomed(event) {
    let transform = event.transform;
    containerG.attr("transform", transform);
    containerG.attr("stroke-width", 1 / transform.k);

    drawHexbins(transform.k);
}