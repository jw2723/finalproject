// MAP VISUALIZATION for sugar consumption
document.addEventListener('DOMContentLoaded', function() {
    const mapSvg = d3.select("#map"),
        mapWidth = +mapSvg.attr("width"),
        mapHeight = +mapSvg.attr("height");
    
    // Define map projection and path
    const projection = d3.geoMercator().scale(130).translate([mapWidth / 2, mapHeight / 1.5]);
    const path = d3.geoPath().projection(projection);
    const tooltip = d3.select(".tooltip");

    let isShowingSugar = true;
    const mainTitle = document.getElementById("mainTitle");

    // List of EU countries
    const eu_member_countries = [
        "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia",
        "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
        "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
        "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia",
        "Spain", "Sweden"
    ];

    // Load GeoJSON data and render the map
    d3.json("map.json").then(function(world) {
        const countries = world.features;

        // Append country paths to the map SVG
        mapSvg.append("g")
            .selectAll("path")
            .data(countries)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path);

        console.log("GeoJSON countries:", countries.map(d => d.properties.name));

        // Load the merged data and bind it to the map
        d3.csv("merged_sugar_life_expectancy.csv").then(function(data) {
            console.log("CSV Data:", data);

            // Color scales for sugar consumption and life expectancy
            const sugarScale = d3.scaleSequential(d3.interpolateReds)
                .domain([0, d3.max(data, d => +d['Average Consumption'])]);

            const lifeExpScale = d3.scaleSequential(d3.interpolateGreens)
                .domain([40, 90]); // Higher contrast for green

            // Update map based on current view (sugar or life expectancy)
            function updateMap(isShowingSugar) {
                mapSvg.selectAll(".country")
                    .data(countries)
                    .transition()
                    .duration(750)
                    .attr("fill", d => {
                        const countryName = d.properties.admin;
                        let countryData = data.find(c => c.Country === countryName ||
                            (countryName === "United States of America" && c.Country === "United States"));

                        if (!countryData && eu_member_countries.includes(countryName)) {
                            countryData = data.find(c => c.Country === "European Union");
                        }

                        console.log(`Country: ${countryName}`, countryData);

                        if (countryData) {
                            return isShowingSugar ? sugarScale(+countryData['Average Consumption']) : lifeExpScale(+countryData['Avg Life Expectancy']);
                        }
                        return '#ccc';
                    });

                // Tooltip mouseover interaction for map countries
                mapSvg.selectAll(".country")
                    .on("mouseover", function(event, d) {
                        const countryName = d.properties.admin;
                        let countryData = data.find(c => c.Country === countryName ||
                            (countryName === "United States of America" && c.Country === "United States"));

                        if (!countryData && eu_member_countries.includes(countryName)) {
                            countryData = data.find(c => c.Country === "European Union");
                        }

                        if (countryData) {
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", .9);
                            tooltip.html(`${countryName}<br/>${isShowingSugar ? `Sugar Consumption: ${countryData['Average Consumption']}` : `Life Expectancy: ${countryData['Avg Life Expectancy']}`}`)
                                .style("left", (event.pageX + 5) + "px")
                                .style("top", (event.pageY - 28) + "px")
                                .style("background", isShowingSugar ? "#ff6666" : "#66b266");
                        }
                    })
                    .on("mouseout", function() {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                updateLegend(isShowingSugar);

                // Title shadow color
                mainTitle.classList.toggle("red-shadow", isShowingSugar);
                mainTitle.classList.toggle("green-shadow", !isShowingSugar);
            }

            // Initial rendering of the map with sugar data
            updateMap(true);

            // Handle the button click to toggle views
            const toggleButton = document.getElementById('toggleButton');
            toggleButton.addEventListener('click', function() {
                isShowingSugar = !isShowingSugar;
                this.textContent = isShowingSugar ? 'Show Life Expectancy' : 'Show Sugar Consumption';
                this.classList.toggle('sugar-button');
                this.classList.toggle('life-expectancy-button');
                updateMap(isShowingSugar);
            });

            // Update legend based on current view
            function updateLegend(isShowingSugar) {
                const legendSvg = d3.select("#legend");
                legendSvg.selectAll("*").remove();

                const legendScale = isShowingSugar ? sugarScale : lifeExpScale;
                const legendTitle = isShowingSugar ? "Sugar Consumption" : "Life Expectancy";
                const legendDomain = legendScale.domain();

                // Gradient for legend
                const gradient = legendSvg.append("defs")
                    .append("linearGradient")
                    .attr("id", "gradient")
                    .attr("x1", "0%")
                    .attr("y1", "100%")
                    .attr("x2", "0%")
                    .attr("y2", "0%");

                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", legendScale(legendDomain[0]));

                gradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", legendScale(legendDomain[1]));

                // Legend rectangle
                legendSvg.append("rect")
                    .attr("x", 20)
                    .attr("y", 20)
                    .attr("width", 20)
                    .attr("height", 200)
                    .style("fill", "url(#gradient)");

                // Legend scale
                const legendScaleY = d3.scaleLinear()
                    .domain(legendDomain)
                    .range([200, 0]);

                const legendAxis = d3.axisRight(legendScaleY)
                    .ticks(5);

                legendSvg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(40, 20)")
                    .call(legendAxis);

                // Legend title
                legendSvg.append("text")
                    .attr("x", 20)
                    .attr("y", 10)
                    .attr("font-weight", "bold")
                    .text(legendTitle);
            }
        }).catch(error => console.error('Error loading CSV data:', error));
    }).catch(error => console.error('Error loading map data:', error));
});


// GROUPED BAR CHART for meat consumption
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append SVG element for the meat chart
const meatSvg = d3.select("#meatChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales and colors for bag gtaph
const x0 = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1);
const x1 = d3.scaleBand().padding(0.05);
const y = d3.scaleLinear().rangeRound([height, 0]);
const z = d3.scaleOrdinal().range(["#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

// Define tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load data
d3.csv("average_meat_consumption.csv").then(data => {
    const meatTypes = ['BEEF', 'PIG', 'POULTRY', 'SHEEP'];
    const countries = [...new Set(data.map(d => d.Country))];

    // Reshape the data for the grouped bar chart
    const formattedData = countries.map(country => {
        return {
            country,
            meats: meatTypes.map(meat => {
                const meatData = data.find(d => d.Country === country && d['Type of Meat'] === meat);
                return {
                    type: meat,
                    value: meatData ? +meatData['Average Consumption (kg per capita)'] : 0
                };
            })
        };
    });

    // Set the domains for scales
    x0.domain(countries);
    x1.domain(meatTypes).rangeRound([0, x0.bandwidth()]);
    y.domain([0, d3.max(formattedData, d => d3.max(d.meats, meat => meat.value))]).nice();
    z.domain(meatTypes);

    // Create bars for the grouped chart
    const bars = meatSvg.append("g")
        .selectAll("g")
        .data(formattedData)
        .enter().append("g")
        .attr("transform", d => `translate(${x0(d.country)},0)`)
        .selectAll("rect")
        .data(d => d.meats)
        .enter().append("rect")
        .attr("x", d => x1(d.type))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => z(d.type))
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${d.type}: ${d.value} kg`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("background", z(d.type));
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add x-axis
    meatSvg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    // Add y-axis
    const yAxis = meatSvg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"));

    yAxis.append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Consumption (kg per capita)");

    // Add legend for meat types
    const legend = meatSvg.append("g")
        .attr("class", "legend")
        .attr("font-family", "Apple Chancery")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(meatTypes.slice().reverse())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);

    // Filter buttons for individual meat types
    window.filterByMeat = function (meatType) {
        const maxVal = d3.max(formattedData, d => d3.max(d.meats.filter(meat => meat.type === meatType), meat => meat.value));
        y.domain([0, maxVal]).nice();
        yAxis.transition().duration(500).call(d3.axisLeft(y).ticks(null, "s"));

        meatSvg.selectAll("rect")
            .transition().duration(500)
            .attr("y", d => y(d.type === meatType ? d.value : 0))
            .attr("height", d => d.type === meatType ? height - y(d.value) : 0)
            .attr("opacity", d => d.type === meatType ? 1 : 0.2);

        // Highlight active button
        d3.selectAll(".button-container button").classed("active", false);
        d3.select(`#${meatType.toLowerCase()}Button`).classed("active", true);

        updateLegend(meatType);
    };

    window.showAll = function () {
        y.domain([0, d3.max(formattedData, d => d3.max(d.meats, meat => meat.value))]).nice();
        yAxis.transition().duration(500).call(d3.axisLeft(y).ticks(null, "s"));

        meatSvg.selectAll("rect")
            .transition().duration(500)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value))
            .attr("opacity", 1);

        // Remove active class from all buttons
        d3.selectAll(".button-container button").classed("active", false);

        // Reset legend
        updateLegend();
    };

    // Update legend function
    function updateLegend(meatType) {
        legend.selectAll("rect")
            .attr("fill", d => meatType ? (d === meatType ? z(d) : "#fff") : z(d));

        legend.selectAll("text")
            .attr("fill", d => meatType ? (d === meatType ? "#000" : "#999") : "#000");
    }
}).catch(error => console.error('Error loading or processing data:', error));
