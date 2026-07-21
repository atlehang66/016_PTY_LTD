/* ============================================================
   Ark Tech — Architecture Tree Diagram connector script
   Measures root + branch node positions and draws bezier
   curves in the SVG overlay. No dependencies.
   ============================================================ */

(function () {
  var diagram = document.getElementById("archDiagram");
  var svg = document.getElementById("archConnectors");
  if (!diagram || !svg) return;

  function draw() {
    // Clear previous paths
    while (svg.querySelector("path")) svg.querySelector("path").remove();

    var dRect = diagram.getBoundingClientRect();

    // Set SVG viewport to match the diagram
    svg.setAttribute("width", dRect.width);
    svg.setAttribute("height", dRect.height);
    svg.setAttribute("viewBox", "0 0 " + dRect.width + " " + dRect.height);

    // Root anchor point (right edge, vertically centered)
    var root = diagram.querySelector(".node-root");
    if (!root) return;
    var rRect = root.getBoundingClientRect();
    var startX = rRect.right - dRect.left;
    var startY = rRect.top + rRect.height / 2 - dRect.top;

    // Branch anchor points (left edge, vertically centered)
    var branches = diagram.querySelectorAll(".arch-branches-col .arch-node");
    var midX = startX + (dRect.width - startX) * 0.45;

    branches.forEach(function (branch) {
      var bRect = branch.getBoundingClientRect();
      var endX = bRect.left - dRect.left;
      var endY = bRect.top + bRect.height / 2 - dRect.top;

      // Smooth cubic bezier from root to branch
      var cx1 = startX + (midX - startX) * 0.7;
      var cx2 = endX - (endX - midX) * 0.7;
      var d = "M " + startX + " " + startY +
              " C " + cx1 + " " + startY + ", " +
              cx2 + " " + endY + ", " +
              endX + " " + endY;

      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
  }

  // Initial draw after layout settles
  if (document.readyState === "complete") {
    draw();
  } else {
    window.addEventListener("load", draw);
  }

  // Redraw on resize
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 80);
  });

  // Redraw when fonts load (shifts layout)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }
})();