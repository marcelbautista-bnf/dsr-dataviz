// IMPORTANT: importer d3 ici (ESM)
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = innerWidth, height = innerHeight;
const tooltip = document.getElementById("tooltip");

const svg = d3.select("#chart").append("svg")
  .attr("viewBox", [0, 0, width, height]);

const g = svg.append("g");

// zoom/pan
svg.call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)));

const color = d3.scaleOrdinal(d3.schemeTableau10);

// ⚠️ chemin RELATIF depuis index.html
const graph = await d3.json("./data/bnf_dsr_graph.json").catch(err => {
  console.error("Erreur de chargement JSON:", err);
});

if (!graph) {
  d3.select("#chart").append("div").text("Impossible de charger data/bnf_dsr_graph.json");
  throw new Error("JSON introuvable");
}

// flèches
svg.append("defs").append("marker")
  .attr("id","arrow").attr("viewBox","0 -5 10 10")
  .attr("refX",20).attr("refY",0).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto")
  .append("path").attr("d","M0,-5L10,0L0,5").attr("fill","#999");

// liens
const link = g.append("g").attr("stroke","#999").attr("stroke-opacity",0.6)
  .selectAll("line").data(graph.links).join("line")
  .attr("stroke-width",1.6).attr("marker-end","url(#arrow)");

// nœuds (rect + label)
const node = g.append("g").selectAll("g").data(graph.nodes).join("g")
  .call(d3.drag()
    .on("start", (e,d) => { if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
    .on("drag", (e,d) => { d.fx=e.x; d.fy=e.y; })
    .on("end",  (e,d) => { if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }));

node.append("rect")
  .attr("x",-80).attr("y",-18).attr("rx",10).attr("ry",10)
  .attr("width",160).attr("height",36)
  .attr("fill", d => color(d.group));

node.append("text")
  .attr("text-anchor","middle").attr("dominant-baseline","central")
  .attr("fill","white").attr("font-weight","bold").attr("font-size",12)
  .text(d => d.id);

// labels de liens
const label = g.append("g").selectAll("text").data(graph.links).join("text")
  .attr("font-size",10).attr("fill","#444").text(d => d.label);

// tooltip
node.on("mouseover", (e,d) => {
    tooltip.style.visibility = "visible";
    tooltip.textContent = `${d.id} — ${d.group}`;
  })
  .on("mousemove", (e) => {
    tooltip.style.top  = (e.pageY + 10) + "px";
    tooltip.style.left = (e.pageX + 10) + "px";
  })
  .on("mouseout", () => tooltip.style.visibility = "hidden");

// simulation
const sim = d3.forceSimulation(graph.nodes)
  .force("link", d3.forceLink(graph.links).id(d => d.id).distance(200).strength(0.4))
  .force("charge", d3.forceManyBody().strength(-400))
  .force("center", d3.forceCenter(width/2, height/2))
  .force("collision", d3.forceCollide(70));

sim.on("tick", () => {
  link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
  node.attr("transform", d => `translate(${d.x},${d.y})`);
  label.attr("x", d => (d.source.x + d.target.x)/2)
       .attr("y", d => (d.source.y + d.target.y)/2);
});

