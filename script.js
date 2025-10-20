import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = innerWidth, height = innerHeight;
const tooltip = document.getElementById("tooltip");

const svg = d3.select("#chart").append("svg")
  .attr("viewBox", [0, 0, width, height]);

const g = svg.append("g");
svg.call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)));

const color = d3.scaleOrdinal(d3.schemeTableau10);

// chargement des données
const graph = await d3.json("data/bnf_dsr_graph.json");

const link = g.append("g").attr("stroke","#999").attr("stroke-opacity",0.6)
  .selectAll("line").data(graph.links).join("line")
  .attr("stroke-width", 1.8);

const node = g.append("g").selectAll("circle").data(graph.nodes).join("circle")
  .attr("r", 12)
  .attr("fill", d => color(d.group))
  .on("mouseover", (event,d) => {
    tooltip.style.visibility = "visible";
    tooltip.textContent = `${d.id} (${d.group})`;
  })
  .on("mousemove", (event) => {
    tooltip.style.top = event.pageY + 10 + "px";
    tooltip.style.left = event.pageX + 10 + "px";
  })
  .on("mouseout", () => tooltip.style.visibility = "hidden");

const label = g.append("g").selectAll("text").data(graph.nodes).join("text")
  .attr("dy", -20)
  .attr("text-anchor", "middle")
  .attr("font-size", 10)
  .text(d => d.id);

const simulation = d3.forceSimulation(graph.nodes)
  .force("link", d3.forceLink(graph.links).id(d => d.id).distance(200))
  .force("charge", d3.forceManyBody().strength(-400))
  .force("center", d3.forceCenter(width/2, height/2));

simulation.on("tick", () => {
  link.attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
  node.attr("cx", d => d.x).attr("cy", d => d.y);
  label.attr("x", d => d.x).attr("y", d => d.y);
});
