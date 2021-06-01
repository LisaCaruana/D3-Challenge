// Set Chart size 
var svgWidth = 960;
var svgHeight = 500;

// Set margins for chart 
var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

// Derive chart size 
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart and shift the latter by left and top margins.
// D3 looks for something in the class chart and appends an svg image
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Load the data.csv file and append to chart
d3.csv('data/data.csv').then(function(data){
  chartGroup.select('circle')
            .data(data)
            .append('circle')
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', 50)
  console.log(data)
})

// Set parameters for two different X axis 
var chosenXAxis = "poverty";

// The function to create a scale for x axis () accepts two arguments: array and range
function xScale(data, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
      .domain([d3.min(data, d => d[chosenXAxis]) * .90,
      d3.max(data, d => d[chosenXAxis]) * 1.05
    ])
    .range([0, width]);
  return xLinearScale;
}

// Create function to create second x axis and call it on axis transition
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000) //1 second
    .call(bottomAxis);
  return xAxis;
}

// This function is for after transition happens and moves the circle group from one scale to the other
// Line 74 moves the center of each circle to the new location when X axis parameters are changed
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

// Create function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  var label;

  if (chosenXAxis === "poverty") {
    label = "% in Poverty:";
  }
  else {
    label = "Age:";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "central")
    .html(function(d) {
      return (`${d.abbr}<br> ${d[chosenXAxis]}%`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data, this);
  })
    // create on-mouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute the functions, nothing has been called yet
// The .then means wait for the data to be fulfilled before doing anything
d3.csv("data/data.csv").then(function(data, err) {
  if (err) throw err; //error message if too much time passes
  console.log(data)
  // parse data - CSV's always return string values, need to typecast data
  data.forEach(function(data) {
    data.poverty = +data.poverty;
    data.healthcare = +data.healthcare;
    data.age = +data.age;
  });

  // Create the x scale using the xLinearScale function above csv import, calls d3.linearscale
  // This returns a scaler function
  var xLinearScale = xScale(data, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.healthcare))
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // Append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // Append y axis
  chartGroup.append("g")
    .call(leftAxis);

  // Append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(data) //iterates through data
    .enter() //creates a placeholder
    .append("circle") //appends a circle in the placeholder
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.healthcare))
    .attr("r", 20)
    .attr("fill", "green")
    .attr("opacity", ".5");
    // .append("text")
    // .text(d=>d.abbr)
    // .attr("text-anchor", "middle")
    // .attr("alignment-baseline", "central");

  var stateLabels =  circlesGroup.select("text")
    .data(data)
    .enter()
    .append("text")
    .text( d => (d.abbr))
    .attr("dx", d => xLinearScale(d.poverty))
    .attr("dy", d=> yLinearScale(d.healthcare))
    // .attr("cx", "cy")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "central")
      // return(circlesGroup.stateText)
    // .attr("dx"=>"text")
     
  // Create group for two x-axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("% in Poverty");

  var age = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age");

  // Append y axis - this determines location of y axis label and rotates words to vertical 
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("% with Healthcare");

  // Update ToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

  // Create x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(data, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "poverty") {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          age
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          age
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
}).catch(function(error) {
  console.log(error);
});


// Call

// .selectAll(circlesGroup)
// .data(data)
// .enter()
// .append("circle")
  // .offset([80, -60])
  
  // var circleText = circlesGroup.append("g"
  //   .selectAll('.stateText')
  //   .data(data)
  //   .enter()
  //   .append("text")
  //   .text(d=>d.abbr)
  //   .attr("text-anchor", "middle")
  //   .attr("alignment-baseline", "central")

  //   );
