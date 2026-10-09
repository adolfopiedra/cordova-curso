// Global Variables

//Create Map and OSM Layer//
var map = L.map("map", {zoomControl: false}); // L: root element of Leaflet

// Tile map server (OpenStreetMap)
var osmURL = "https://{s}.tile.osm.org/{z}/{x}/{y}.png";
//var osmURL = "https://tile.osm.org/{z}/{x}/{y}.png";

// s: server
// z: zoom level (client), directory (server)
// x: column (client), directory (server)
// y: row (client), PNG file (server)

// Leaflet layer
var osm = L.tileLayer(osmURL);

// Show map
map.setView([0.0, 0.0], 1);

// [0.0, 0.0] coordinates at screen center
// 1: Zoom level 1. Zoom ranges from 0 (out) - 18 (in)

map.addLayer(osm);

//Create PNOA Layer
var currentLayer = "osm";

// PNOA stands for Plan Nacional de Ortofotografía Aérea
var pnoa = L.tileLayer.wms(
	"https://www.ign.es/wms-inspire/pnoa-ma?SERVICE=WMS&",
	{
		layers: "OI.OrthoimageCoverage", // Layer name
		transparent: true,
		format: "image/jpeg",
		version: "1.3.0",
		attribution: "&copy; CNIG"
	}
);

var baseMaps = {
	"osm": osm,
	"pnoa": pnoa
}



// App starts here

function onDeviceReady() {
	//showToast("onDeviceReady()");
	
	// Click events
	document.getElementsByClassName("fa-solid fa-location-dot")[0].addEventListener("click", toggleLocation);
	document.getElementsByClassName("fa-solid fa-keyboard")[0].addEventListener("click", toggleIDBox);
	document.getElementsByClassName("fa-solid fa-square-plus")[0].addEventListener("click", storePoint);
	document.getElementsByClassName("fa-solid fa-square-minus")[0].addEventListener("click", clearMemory);
	document.getElementsByClassName("fa-solid fa-layer-group")[0].addEventListener("click", switchBaseMap);
	document.getElementsByClassName("fa-solid fa-floppy-disk")[0].addEventListener("click", saveGeoJSON);
    autocenter()

}

// User functions

function toggleIDBox() {

	//alert("toggleIDBOX()");
	
	var pointID = document.getElementById("point-id");
	
	if (pointID.style.display == "none") {
		// Now it is invisible
		pointID.style.display = "block";
		// Now it is vivible
	} else if (pointID.style.display == "block") {
		pointID.style.display = "none";
	}
}

function storePoint() {
	//showToast("storePoint()");
	
	// Check there are coordinates
	if (point.geometry.coordinates[0] == null || point.geometry.coordinates[1] == null) {
		showToast("Collect coordinates before saving");
		return;
	}
	
	// || = Logical OR
	
	// Counter
	
	var counter = pointArray.length;
	var counterPointID = String(counter).padStart(4, "0");
	
	// Get point ID from text box
	
	var pointIDText = document.getElementById("point-id-text");
	
	if (pointIDText.value.trim() === "") {
		// trim(): removes blanks at the beginning and end of the string
		point.id = counterPointID;
	} else {
		var pointIDValue = pointIDText.value.trim();
		point.id = pointIDValue;
	}
	
	// Properties
	point.properties.count = counterPointID;
	
	
	
	// TODO: convert to UTM and store in
	// point.properties.utm.x
	// point.properties.utm.y
	// point.properties.utm.zone
	// using a new function geoToUTM(longitude, latitude)
	
	// Add to array of points
	pointArray.push(JSON.parse(JSON.stringify(point))); // Weird but works
	
	// Empty text box
	pointIDText.value = "";
	
	// Hide text box
	var pointID = document.getElementById("point-id");
	
	if (pointID.style.display == "block") {
		pointID.style.display = "none";
	}
	
	console.log(JSON.stringify(pointArray, null, 4));
	
	// Leaflet point
	
	var leafletPointID = L.circle( // Point entity in Leaflet format
	    point.geometry.coordinates.toReversed(),
		leafletPointOptions
	);
	
	var popup = "";
	
	popup += "ID = " + point.id + "<br>";
	popup += "Longitude = " + point.geometry.coordinates[0].toFixed(8) + "<br>";
	popup += "Latitude = " + point.geometry.coordinates[1].toFixed(8) + "<br>";
	
	leafletPointID.bindPopup(popup);
	
	leafletPointID.addTo(map); // Draw point marker
	
	leafletPointArray.push(leafletPointID); // Keep leaflet marker reference
}

function clearMemory() {
	
	if (pointArray.length === 0) {
		showToast("There are no data collected yet.");
		return;
	}
	
	// Ask to clear memory
	var clear = confirm("All collected data will be removed. Proceed?");
	
	//console.log(clear);
	
	if (!clear) {
		// ! = logical not operator
		return;
	}
	
	// Clear memory contents
	
	pointArray = []
	
	point = {
		"id": null,
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": []
		},
		"properties": {"utm": {"x": null, "y": null, "zone": null}}
	}	
	
	console.log(JSON.stringify(pointArray, null, 4));

	
	// Clear leaflet points
	
	for (var count = 0; count < leafletPointArray.length; count++) {
		map.removeLayer(leafletPointArray[count]);
	}
	
	leafletPointArray = [];
}

function switchBaseMap() {
	if (currentLayer == "osm") {
		map.removeLayer(baseMaps["osm"]);
		map.addLayer(baseMaps["pnoa"]);
		currentLayer = "pnoa";
	} else if (currentLayer == "pnoa") {
		map.removeLayer(baseMaps["pnoa"]);
		map.addLayer(baseMaps["osm"]);
		currentLayer = "osm";
	}
}

function saveGeoJSON() {
	//alert("saveJSON()");
	
	if (pointArray.length === 0) {
		showToast("There are no data collected yet.");
		return;
	}
	
	// Save data to local disk (4 steps)
	
	// 1. MIME (Multpurpose Internet Mail Extension)

	var mime = "data:application/json;charset=utf-8,"; // Header of data
	
	
	// 2. Create <a> with JS (a=anchor)

    var geojson = {"type": "FeatureCollection", "features": pointArray};
	
	var saveLink = document.createElement("a");

	saveLink.setAttribute("href", mime + encodeURI(JSON.stringify(geojson, null, 4)));
	saveLink.setAttribute("download", "points.geojson"); // Data file
	
	
	// 3. Add <a> to HTML
	
	document.body.appendChild(saveLink);
	
	
	// 4. Click on <a> (virtual)
	saveLink.click();
}

























var jsonObject; //undefined value, global variable.
function readJSON() { //Prototype
    //alert("Reading JSON file");

    // var url = "https://personales.upv.es/amarques/MUIGG/DATASETS/earthquake.geojson"; //URL of the JSON file
    var url = "https://geoportal.valencia.es/server/rest/services/OPENDATA/UrbanismoEInfraestructuras/MapServer/288/query?where=1=1&outFields=*&f=geojson";
    // Pattern to send GET requests

    // 1. Create XHR instance
    var xhr = new XMLHttpRequest();

    // 2. Open and send request
    xhr.open("GET", url, true); //http verb, URL, true = asynchronous (no block), false = synchronous (block)
    xhr.send();

    // 3. Get response

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) { //readyState = 4 means request is done, status = 200 means OK
            // we have a response
            var jasonText = xhr.responseText; //responseText is a string
            

            // JSON format
            // Convert string to JSON object in python dictionary format
            jsonObject = JSON.parse(jasonText);

            // Convert JSON object to string in JSON format

            var jsonTextDuplicate = JSON.stringify(jsonObject, null, 4); //null = no replacer, 4 = indentation

            // Print on <div id="text-box">
            // document = HTML
            var textBox = document.getElementById("text-box");
            textBox.innerHTML = jsonTextDuplicate; //print the string in the <div> element

            console.log(jsonTextDuplicate); //print the string in the console

        }
    }
}

//exercise 5

function saveJSON() {

    //alert("Save JSON()");

    if (typeof jsonObject == 'undefined') {
        alert("Download the data first");
        return;
    }

    //Save the data in local file 4 steps

    //1. Define MIME (Multipurpose Internet Mail Extensions)

    var mime = "data:application/json;charset=utf-8,"; 

    //2. Create <a> a=anchor with JS

    var saveLink = document.createElement("a");

    saveLink.setAttribute(
        "href",
        mime + encodeURI(JSON.stringify(jsonObject, null, 4))
    );
    saveLink.setAttribute("download", "charge.json"); //Function and filename

    //3. Add <a> to HTML

    document.body.appendChild(saveLink);

    //4. Click <a> to download

    saveLink.click();


    }

//exercise 6

function readLocalCSV() {
    //alert("ReadLocalCSV()");
    // var url = "https://personales.upv.es/amarques/MUIGG/DATASETS/earthquake.geojson"; //URL of the JSON file
    var url = "../FILES/random_5000.csv";
    // Pattern to send GET requests

    // 1. Create XHR instance
    var xhr = new XMLHttpRequest();

    // 2. Open and send request
    xhr.open("GET", url, true); //http verb, URL, true = asynchronous (no block), false = synchronous (block)
    xhr.send();

    // 3. Get response

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) { //readyState = 4 means request is done, status = 200 means OK
            // we have a response
            var csvData = xhr.responseText; //responseText is a string
            console.log(csvData); //print the string in the console

            // document = HTML
            var textBox = document.getElementById("text-box");
            textBox.innerHTML = csvData; //print the string in the <div> element

        }
    }
    
}

//exercise 7 utm to geographic

function readLocalJSON() {
    // var url = "https://personales.upv.es/amarques/MUIGG/DATASETS/earthquake.geojson"; //URL of the JSON file
    var url = "../FILES/Tra_recarga_electrica.JSON";
    // Pattern to send GET requests

    // 1. Create XHR instance
    var xhr = new XMLHttpRequest();

    // 2. Open and send request
    xhr.open("GET", url, true); //http verb, URL, true = asynchronous (no block), false = synchronous (block)
    xhr.send();

    // 3. Get response

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) { //readyState = 4 means request is done, status = 200 means OK
            // we have a response
            var jasonText = xhr.responseText; //responseText is a string
            

            // JSON format
            // Convert string to JSON object in python dictionary format
            jsonObject = JSON.parse(jasonText);

            // Convert JSON object to string in JSON format

            var jsonTextDuplicate = JSON.stringify(jsonObject, null, 4); //null = no replacer, 4 = indentation

            // Print on <div id="text-box">
            // document = HTML
            var textBox = document.getElementById("text-box");
            textBox.innerHTML = jsonTextDuplicate; //print the string in the <div> element

            console.log(jsonTextDuplicate); //print the string in the console

        }
    }


}

function utmToGeo() {
    //alert("utmToGeo()");
    if (typeof jsonObject == 'undefined') {
        alert("Download the data first");
        return;
    }

    //Coordinate transformation PROJ4JS

    //Source and target CRSs using PROJ format

    proj4.defs("EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");
    proj4.defs("EPSG:4326", "+proj=latlon +ellps=WGS84 +datum=WGS84 +no_defs");

    //Process GeoJSON

    for (var i = 0; i < jsonObject.features.length; i++) {
        //console.log(i);

        //1. Get UTM Coordinates.
        var utmPoint = jsonObject.features[i].geometry.coordinates; //array of 2 elements [x,y]
        console.log(utmPoint);

        //2. Transform UTM to Geographic
        var geoPoint = proj4("EPSG:25830", "EPSG:4326", utmPoint);
        console.log(geoPoint);

        //3. Update GeoJSON with Geographic coordinates
        jsonObject.features[i].geometry.coordinates = geoPoint; //array of 2 elements [lon,lat]

        //4. Keep utm coordinates in properties
        jsonObject.features[i].properties.utm = utmPoint; //array of 2 elements [x,y]

    }

    //Remove "crs" property from GeoJSON
    delete jsonObject.crs;
    var textBox = document.getElementById("text-box");
    textBox.innerHTML = "";
    textBox.innerHTML = JSON.stringify(jsonObject, null, 4); //print the string in the <div> element

}

//exercise 8 geolocation

//Globals variables
var point = {
	"id":null,
    "type": "Feature",
    "geometry": {
        "type": "Point",
        "coordinates": []
    },
    "properties": {"East":null,"North":null,"zone":null}
};
var geolocationOptions = {
    enableHighAccuracy: true, //GPS
    timeout: 10000 //10 seconds
}

function getLocation() {
    // alert("getLocation()");
    //HTML5 Geolocation: IP address, Wi-Fi, Cell tower, GPS (High accuracy)

    //Check if geolocation is available in the browser
    if (navigator.geolocation) {
        //alert("Starting geolocation service")
        
        showToast("Starting geolocation service")

        //Geolocation
        navigator.geolocation.getCurrentPosition(geolocationSuccess,geolocationError,geolocationOptions);
    } else {
        alert("Geolocation service not supported.");
    }



}

function formatCoordinates(format="geo") {
	
	var separator = "&nbsp;&nbsp;&nbsp;&nbsp;"; // &nbsp; = HTML blank space
	var coordinateString = "";
	
	if (format == "geo") {
		coordinateString += point.geometry.coordinates[1].toFixed(8);
		coordinateString += separator;
		coordinateString += point.geometry.coordinates[0].toFixed(8);
		coordinateString += separator;
		coordinateString += "[" + point.properties.accuracy.toFixed(2) + "]";
	}
	
	return coordinateString;
}

function geolocationSuccess(position) {
    //alert("geolocationSuccess()");
    point.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
    point.properties.accuracy = position.coords.accuracy;
    point.properties.timestamp = position.timestamp;

    var separator = "&nbsp;&nbsp;&nbsp;&nbsp;";
    //Console JSON
    console.log(JSON.stringify(point, null, 4));

    //coordinateString = "Longitude: " + point.geometry.coordinates[0] + "<br>Latitude: " + point.geometry.coordinates[1] + "<br>Accuracy: " + point.properties.accuracy + " meters<br>Timestamp: " + new Date(point.properties.timestamp).toLocaleString();
    coordinateString = point.geometry.coordinates[0].toFixed(8) + "°"; //8 decimal places
    coordinateString += separator;
    coordinateString += point.geometry.coordinates[1].toFixed(8) + "°";
    coordinateString += separator;
    coordinateString += point.properties.accuracy.toFixed(2) + " meters";

    document.getElementById("coordinates-text").innerHTML = coordinateString;


}

function geolocationError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("Geolocation service is denied.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Position unavailable.");
            break;
        case error.TIMEOUT:
            alert("Geolocation request timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("Unknown geolocation error.");
            break;
    }
}

function showToast(message) {
    //alert("showToast()");
    var toast = document.getElementById("toast");
    toast.innerHTML = message;
    toast.style.display = "block"; //block = visible
    setTimeout(function () { //anonymous function to hide the toast after 3 seconds
        toast.style.display = "none"; //none = hidden
    }, 5000); //5 seconds
}

//Excercise 09 - watch location
var watchID = null; // null = geolocation disabled, not null = geolocation enabled

function toggleLocation() {
	//alert("toggleLocation()");
	
	if (watchID === null) {
		// Start geolocation
		showToast("Starting geolocation service.");
		watchID = navigator.geolocation.watchPosition(
			geolocationSuccess, geolocationError, geolocationOptions
		);
		
		document.getElementsByClassName("fa-solid fa-location-dot")[0].style.color = "cyan";
	} else {
		// Stop geolocation
		showToast("Stopping geolocation service.");
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
		document.getElementsByClassName("fa-solid fa-location-dot")[0].style.color = "black";		
	}
}



var leafletPointOptions = {
    radius: 20, // Adapt to every device
	color: "blue",
	fillOpacity: 0.8
};

var leafletPointArray = [];

function centerMap() {
	//showToast("centerMap()");
	
	if (point.geometry.coordinates.length === 0) {
		showToast("Geolocation not available.");
		return;
	}
	
	// Leaflet wants (latitude, longitude)
	map.setView(point.geometry.coordinates.toReversed(), 16); //toReversed le da vuelta a las coordenadas 
}

// Example 11 - Autocenter

function autocenter() {
	
	// Check browser Geolocation support
	if (navigator.geolocation) {
		//alert("Starting geolocation service.");
		showToast("Starting geolocation service.");
		navigator.geolocation.getCurrentPosition(
			geolocationSuccessAutocenter, geolocationError, geolocationOptions
		);
	} else {
		//alert("Geolocation service not supported.");
		showToast("Geolocation service not supported.");
	}
}

function geolocationSuccessAutocenter(position) {
	point.geometry.coordinates = [position.coords.longitude, position.coords.latitude];

	point.properties.accuracy = position.coords.accuracy;
	point.properties.timestamp = position.timestamp;
	
	document.getElementById("coordinates-text").innerHTML = formatCoordinates();
	
	//console.log(JSON.stringify(point, null, 4));
	
	centerMap();
}

// Example 12 - Entities


function processCSV() {
	
	var url = "../files/random_5000.csv";
	
	// Pattern to send GET requests
	
	// 1. Create XHR instance
	
	var xhr = new XMLHttpRequest();
	
	// 2. Open and send request
	
	xhr.open("GET", url, true);
	
	// Parameter 1: HTTP verb
	// Parameter 2: URL
	// Parameter 3: true=asynchronous, false=synchronous
	
	xhr.overrideMimeType("text/csv");
	
	xhr.send();
	
	// 3. Get response
	
	xhr.onreadystatechange = function() { // Anonymous function
		if (xhr.readyState == 4 && xhr.status == 200) {
			// JS notation: && is the logical AND
			// If reach this point we have data
			
			// JS notation: var defines local variables
			
			var csvData = xhr.responseText;
			
			console.log(csvData);
			
			
			// Processing CSV data in JS
			
			var csvLines = csvData.split("\n");
			
			var features = []; // GeoJSON features
			
			// Bounding box
			
			var longitudeMin = 180.0;
			var latitudeMin = 90.0;
			var longitudeMax = -180.0;
			var latitudeMax = -90.0;
						
			for (var count = 0; count < csvLines.length; count++) {
				
				var record = csvLines[count].split(",");
				
				console.log(record);
				
				var longitude = parseFloat(record[1]);
				var latitude = parseFloat(record[2]);
				
				// push ~ append in Python
				
				features.push({
					"type": "Feature",
					"geometry": {
						"type": "Point",
						"coordinates": [longitude, latitude]
					},
					"properties": {
						"count": count,
						"id": record[0]
					}
				});
				
				if (longitude < longitudeMin) {
					longitudeMin = longitude;
				} else if (longitude >= longitudeMax) {
					longitudeMax = longitude;					
				}
				
				if (latitude < latitudeMin) {
					latitudeMin = latitude;
				} else if (latitude >= latitudeMax) {
					latitudeMax = latitude;					
				}
			}
			
			jsonObject = {
				"type": "FeatureCollection",
				"bbox": [longitudeMin, latitudeMin, longitudeMax, latitudeMax],
				"features": features
			}
			
			console.log(JSON.stringify(jsonObject, null, 4));
			
			showToast("Dataset loaded.");
		}
	}
}

// Leaflet

var leafletOptions = {
	radius: 20,
	color: "blue",
	fillOpacity: 0.8
};

var pointArray = [];
var polylineArray = [];
var polygonArray = [];

function drawPoints() {
	
	if (typeof jsonObject === "undefined") {
		showToast("Load data before drawing.");
		return;
	}
	
	// Create Leaflet point entities
	
	for (var count = 0; count < jsonObject.features.length; count++) {
    
		// Leaflet entity
		
		var pointID = L.circle(
			jsonObject.features[count].geometry.coordinates.toReversed(),
			leafletOptions
		);
		
		var popup = "";
		
		popup += "ID = " + jsonObject.features[count].properties.id + "<br>";
		popup += "Longitude = " + jsonObject.features[count].geometry.coordinates[0].toFixed(8) + "<br>";
		popup += "Latitude = " + jsonObject.features[count].geometry.coordinates[1].toFixed(8) + "<br>";
	
		pointID.bindPopup(popup);
		
		pointID.addTo(map); // Drawing the point
		
		pointArray.push(pointID);
	}
}

function clearFeatures() {
	// Remove points
	
	for (var count = 0; count < pointArray.length; count++) {
		map.removeLayer(pointArray[count]);
	}
	
	pointArray = [];
	
	// Remove polylines

	for (var count = 0; count < polylineArray.length; count++) {
		map.removeLayer(polylineArray[count]);
	}
	
	polylineArray = [];
	
	// Remove polygons

	for (var count = 0; count < polygonArray.length; count++) {
		map.removeLayer(polygonArray[count]);
	}
	
	polygonArray = [];
}

function drawPolylines() {

	if (typeof jsonObject === "undefined") {
		showToast("Load data before drawing.");
		return;
	}
	
	var [longitudeMin, latitudeMin, longitudeMax, latitudeMax] = jsonObject.bbox;
	
	var polyline = [
		[latitudeMin, longitudeMin],
		[latitudeMin, longitudeMax],
		[latitudeMax, longitudeMax],
		[latitudeMax, longitudeMin],
		[latitudeMin, longitudeMin]
	]; // Array
	
	var lineID = L.polyline(polyline, {weight: 5, color: "green"});
	
	var popup = "BBOX = " + JSON.stringify(polyline);
	
	lineID.bindPopup(popup);
	
	lineID.addTo(map); // Drawing polyline
	
	polylineArray.push(lineID);
}

function drawPolygons() {
	
	if (typeof jsonObject === "undefined") {
		showToast("Load data before drawing.");
		return;
	}

	var [longitudeMin, latitudeMin, longitudeMax, latitudeMax] = jsonObject.bbox;
	
	var polygon = [
		[latitudeMin, longitudeMin],
		[latitudeMin, longitudeMax],
		[latitudeMax, longitudeMax],
		[latitudeMax, longitudeMin],
		[latitudeMin, longitudeMin]
	]; // Array
	
	var polygonID = L.polygon(polygon, {weight: 5, color: "red"});
	
	var popup = "BBOX = " + JSON.stringify(polygon);
	
	polygonID.bindPopup(popup);
	
	polygonID.addTo(map); // Drawing polyline
	
	polygonArray.push(polygonID);
	
	
}

