
// Globals


// Geolocation

var currentFormat = "geo";
 
var watchID = null; // null = geolocation disabled, not null = geolocation enabled

var point = {
	"type": "Feature",
	"geometry": {
		"type": "Point",
		"coordinates": []
	},
	"properties": {}
}

var geolocationOptions = {
    enableHighAccuracy: true,
	timeout: 10000 // milliseconds
}

var pointArray = [];


// Leaflet


var map = L.map("map",{zoomControl: false})

var osmURL= "https://{s}.tile.osm.org/{z}/{x}/{y}.png";

var osmAtt = "&copy; <a href=\"https://openstreetmap.org/copyright\">OpenStreetMap</a> contributors";

var osm = L.tileLayer(osmURL, {attribution: osmAtt}); // TMS: tile map server

map.setView([0.0, 0.0], 1);

map.addLayer(osm);

var leafletPointOptions = {
	radius: 20,
	color: "blue",
	fillOpacity: 0.8	
};

var leafletPointArray = [];


// Multilayer

var currentLayer = "osm";

// WMS layer

var pnoa = L.tileLayer.wms(
	"http://www.ign.es/wms-inspire/pnoa-ma?SERVICE=WMS&", // PNOA = Plan Nacional de ortofoto aérea, MA = Máxima Actualidad
	{
		layers: "OI.OrthoimageCoverage",
		transparent: true,
		format: "image/jpeg",
		version: "1.3.0",
		attribution: "&copy; CNIG"
	}
);

var baseMaps = {
	"osm": osm,
	"pnoa": pnoa
};


// Cordova file object

var dataFileObject; // Undefined


// Starting point

document.addEventListener('deviceready', onDeviceReady, false);


function onDeviceReady() {
    //showToast("onDeviceReady()");
	
	// Click events ~ onclick
	
	document.getElementsByClassName("fa-solid fa-location-dot")[0].addEventListener("click", toggleLocation);
	document.getElementsByClassName("fa-solid fa-keyboard")[0].addEventListener("click", toggleIDBox);
	document.getElementsByClassName("fa-solid fa-square-plus")[0].addEventListener("click", storePoint);
	document.getElementsByClassName("fa-solid fa-square-minus")[0].addEventListener("click", clearMemory);
	document.getElementsByClassName("fa-solid fa-layer-group")[0].addEventListener("click", switchBaseMap);
	document.getElementsByClassName("fa-solid fa-floppy-disk")[0].addEventListener("click", saveToGeoJSON);

	document.getElementById("coordinates").addEventListener("click", switchFormat);
}


// Geolocation

function getLocation() {
	//alert("getLocation()");
	
	// HTML5 Geolocation: IP address, WiFi, GPS receiver
	
	// Check browser support
	if (navigator.geolocation) {
		//alert("Geolocation service available.");
		showToast("Starting geolocation service.");

		navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, geolocationOptions);
		
	} else {
		//alert("Geolocation service not supported.");
		showAlert("Geolocation service not supported.");
    }
}

function geolocationSuccess(position) {
	
	point.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
	
	point.properties.accuracy = position.coords.accuracy;
	point.properties.timestamp = position.timestamp;
	
	//console.log(JSON.stringify(point, null, 4));
	
	document.getElementById("coordinates-text").innerHTML = formatCoordinates();
	
	
}

function geolocationError(error) {
	switch(error.code) {
        case error.PERMISSION_DENIED:
		    //alert("geolocation request denied.");
		    showToast("geolocation request denied.");
			break;
		case error.POSITION_UNAVAILABLE:
		    //alert("Position unavailable.");
		    showToast("Position unavailable.");
			break;
        case error.TIMEOUT:
		    //alert("Geolocation request timed out.");
		    showToast("Geolocation request timed out.");
			break;
        case error.UNKNOWN_ERROR:
		    //alert("Unknown geolocation error.");
		    showToast("Unknown geolocation error.");
			break;
	}
}

function toggleLocation() {
	//alert("toggleLocation()");
	
	if (watchID === null) {
		// Start Geolocation
	    showToast("Starting geolocation service.");
		watchID = navigator.geolocation.watchPosition(
		    geolocationSuccess, geolocationError, geolocationOptions
		);
		
		document.getElementsByClassName("fa-solid fa-location-dot")[0].style.color = "cyan";
		
	} else {
		// Stop Geolocation
		showToast("Stopping geolocation service.");
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
		document.getElementsByClassName("fa-solid fa-location-dot")[0].style.color = "black";

	}
}


// User input

function toggleIDBox() {
	var pointID = document.getElementById("point-id");
	
	if (pointID.style.display == "none") {  // Invisible
	    pointID.style.display = "block" // Make it visible
	} else if (pointID.style.display == "block") { // Visible
	    pointID.style.display = "none"  // Make it invisible
	}
}


// Store point

function storePoint(){
	//alert("storePoint()");
	
	// check there are coordinates
	
	if (point.geometry.coordinates[0] === null || point.geometry.coordinates[1] === null){
		//alert("collect coordinates befores saving");
		showAlert("Collect coordinates befores saving.");
		return;
	}
	
	//Point counter (in string format)
	
	var counterPointID = ("0000" + pointArray.length.toString()).substr(-4);
	
	//console.log(counterPointID);
	
	// Get point ID from text box 
	
	var pointIDText = document.getElementById("point-id-text");
	
	if (pointIDText.value.trim() === ""){
		var pointIDValue = counterPointID;
		point.id = counterPointID;
	} else {
		var pointIDValue = pointIDText.value.trim();
		point.id = pointIDValue;
	}
	
	// Propeties
	point.properties.count = counterPointID;
	
	// Append current feature to point Array
	pointArray.push(JSON.parse(JSON.stringify(point)));
	
	//console.log(JSON.stringify(pointArray, null, 4));
	
	// Reset text box
	pointIDText.value = "";
	
	// Hide text box
	var pointID = document.getElementById("point-id");
	
	if (pointID.style.display == "block"){
		pointID.style.display = "none";
	}
	
    // Leaflet point	
	var leafletPointID = L.circle(
		point.geometry.coordinates.toReversed(),
		leafletPointOptions
	);
		
	var popup = "";
	
	popup += "ID = " + point.id + '<br>';
	popup += "Longitude = " + point.geometry.coordinates[0].toFixed(8) + '<br>';
	popup += "Latitude = " + point.geometry.coordinates[1].toFixed(8) + '<br>';
		
	leafletPointID.bindPopup(popup);
		
	leafletPointID.addTo(map); // Drawing point marker
		
	leafletPointArray.push(leafletPointID); // Keep leaflet marker
}


// Clear memory

function clearMemory() {
	
	//alert("clearMemory()");
	
	// Are there data to clear?
	
	if (pointArray.length == 0) {
		//alert("There are no data collected yet.");
		showAlert("There are no data collected yet.");
		return;
	}
	
	// Ask to clear memory
	
	//var clearMemory = confirm("All collected data will be removed. Proceed?");
	
	showConfirm("All collected data will be removed. Proceed?");
}

function clearData() {
	//showAlert("clearData()");
	
	// Clear points
	
	pointArray = [];
	
	// Reset variable point
	
	point = {
		"id": null,
		"type": "Feature",
		"geometry": {
			"type": "point",
			"coordinates": []
		},
		"properties": {}
	}
	
	// Clear Leaflet markers
	
	for (var count=0; count<leafletPointArray.length; count++) {
		map.removeLayer(leafletPointArray[count]);
	}
	
	leafletPointArray = [];
}


// Switch base map

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



// Miscelaneous functions


function showToast(message) {
    var toast = document.getElementById("toast");
    
    toast.innerHTML = message;
    
    toast.style.display = "block";
    
    setTimeout(function(){toast.style.display = "none";}, 5000);
    // delay = 5000 ms
}


function formatCoordinates(format=currentFormat) {

    var separator = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"; // &nbsp; = HTML blank space
	var coordinateString = "";
	
	if (format == "geo") {
		coordinateString += point.geometry.coordinates[1].toFixed(8);
		coordinateString += separator;
		coordinateString += point.geometry.coordinates[0].toFixed(8);
		coordinateString += separator;
		coordinateString += "[ " + point.properties.accuracy.toFixed(2) + " ]";
	} else if (format == "dms") {
		coordinateString = formatDMS();
	} else if (format == "utm") {
		coordinateString = formatUTM();
	}
	
	return coordinateString;
}


function formatDMS(numberOfDecimalSeconds=4) {

	var latitude = point.geometry.coordinates[1];
	var longitude = point.geometry.coordinates[0];

    var separator = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"; // &nbsp; = HTML blank space

	var formatString = "";
	var latitudeHemisphere = "N";
	var longitudeHemisphere = "E";

	// Latitude
  
	if (latitude < 0) {
		latitude = Math.abs(latitude);
		latitudeHemisphere = "S";
	} 
  
	var degrees = latitude | 0;
	var minutes = ((latitude - degrees) * 60) | 0;
	var seconds = (((latitude - degrees) * 60) % 1) * 60;
  
	formatString += degrees.toString().padStart(2, " ");
	formatString += "\u00B0 ";
	formatString += minutes.toString().padStart(2, "0");
	formatString += "\u0027 ";
	formatString += seconds.toFixed(numberOfDecimalSeconds).padStart(numberOfDecimalSeconds + 3, "0");
	formatString += "\u0022 " + latitudeHemisphere;
	formatString += separator;
  
	// Longitude
	  
	if (longitude < 0) {
		longitude = Math.abs(longitude);
		longitudeHemisphere = "W";
	} 
  
	degrees = longitude | 0;
	minutes = ((longitude - degrees) * 60) | 0;
	seconds = (((longitude - degrees) * 60) % 1) * 60;

	formatString += degrees.toString().padStart(3, " ");
	formatString += "\u00B0 ";
	formatString += minutes.toString().padStart(2, "0");
	formatString += "\u0027 ";
	formatString += seconds.toFixed(numberOfDecimalSeconds).padStart(numberOfDecimalSeconds + 3, "0");
	formatString += "\u0022 " + longitudeHemisphere;
	formatString += separator;
		
	// Accuracy
	formatString += "[ " + point.properties.accuracy.toFixed(2) + " ]";
	
	  
	return(formatString);
}


function formatUTM() {

	var latitude = point.geometry.coordinates[1];
	var longitude = point.geometry.coordinates[0];

    var separator = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    var formatString = "";
    
	var zone = Math.trunc(31 + (longitude / 6));

	var source = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs +type=crs";
	var target = "+proj=utm +zone=" + zone + "+ellps=GRS80 +units=m +no_defs +type=crs";

	var projected = proj4(source, target, [longitude, latitude]);

	formatString += zone.toString();
	formatString += separator;
	formatString += projected[0].toFixed(3);
	formatString += separator;
	formatString += projected[1].toFixed(3);
	formatString += separator;
	formatString += "[ " + point.properties.accuracy.toFixed(2) + " ]";
	
	return formatString;
}


function createDateTimeFilename() {
	// How to get current date/time in JS
	
	var rightNow = new Date();
	
	var day = ("00" + rightNow.getUTCDate()).substr(-2,2);
	var month = ("00" + (rightNow.getUTCMonth() + 1)).substr(-2,2);
	var year = ("0000" + rightNow.getUTCFullYear()).substr(-4,4);
	
	var hour = ("00" + rightNow.getUTCHours()).substr(-2,2);
	var minute = ("00" + rightNow.getUTCMinutes()).substr(-2,2);
	var second = ("00" + rightNow.getUTCSeconds()).substr(-2,2);

	// Filename
	var filename = year + month + day + "_" + hour + minute + second + ".geojson";
	
	return(filename);
}

function dateTimeFilename(extension) {
	// How to get current date/time in JS
	
	var rightNow = new Date();
	
	var day = ("00" + rightNow.getUTCDate()).substr(-2,2);
	var month = ("00" + (rightNow.getUTCMonth() + 1)).substr(-2,2);
	var year = ("0000" + rightNow.getUTCFullYear()).substr(-4,4);
	
	var hour = ("00" + rightNow.getUTCHours()).substr(-2,2);
	var minute = ("00" + rightNow.getUTCMinutes()).substr(-2,2);
	var second = ("00" + rightNow.getUTCSeconds()).substr(-2,2);

	// Filename
	var filename = year + month + day + "_" + hour + minute + second + "." + extension;
	
	return(filename);
}

// Cordova dialogues

function showAlert(message) {
	
	// cordova-plugin-dialogs ~ provides notification object
	
	navigator.notification.alert(
		message,
		function(){}, // Callback anonymous, empty function
		"E2",
		"OK"
	);
	
	return;
}

function showConfirm(message) {
	// cordova-plugin-dialogs ~ notification
	navigator.notification.confirm(
		message,
		onConfirm, // Callback function
		"E2",
		["OK", "Cancel"] // buttons: "OK" = 1, "Cancel" = 2
	);
}

function onConfirm(buttonIndex) {
	if (buttonIndex == 1) {
		clearData();
	}
}



// Cordova filesystem

function saveToGeoJSON() {

	// Are there data to clear?
	
	if (pointArray.length == 0) {
		showAlert("There are no data collected yet.");
		return;
	}
	
	// Data directory (folder) in Android
	
	var dataDirectory = cordova.file.externalDataDirectory; // Constant
	
	// Filename
	
	//var filename = "dataset.geojson";
	var filename = dateTimeFilename("geojson");
	
	// GeoJSON dataset
	
	var geoJSON = {type: "FeatureCollection", features: pointArray};
	
	// Write file (cordova-plugin-file)
	
	window.resolveLocalFileSystemURL(
		dataDirectory,
		function(directory) {
			directory.getFile(
				filename,
				{create: true},
				function(file) {
					dataFileObject = file; // Memory address of the file
					writeDataFile(JSON.stringify(geoJSON, null, 4)); // External, user defined function
				}
			);
		}
	);
}


function writeDataFile(geoJSONString) {
	
	// Check dataFileObject has a valid value
	
	if (!dataFileObject) {
		// ShowAlert();
		return;
	}
	
	// ! = NOT
	
	// Create a "writer" object based on dataFileObject which grants file access
	
	// createWriter() takes 2 parameters:
	//     1. Success callback function
	//     2. Error callback function
	
	dataFileObject.createWriter(
		function(fileWriter) {
			// Go to the beginning of the file (usually not necessary)
			fileWriter.seek(0);
			
			// Create a new instance of the class Blob
			
			var blob = new Blob([geoJSONString], {type: "text/json"});
			
			// Write the data, at least!!!!
			
			fileWriter.write(blob);
		},
		writeDataFileError
	);
	
	// If we reach this point the file is already stored
	
	showAlert("Data file saved to device disk.");
}


function writeDataFileError(error) {
	showAlert("File system error: \n" + JSON.stringify(error, null, 4));
}



// Switch coordinates format ~ onclick event in onDeviceReady()

function switchFormat() {

	if (document.getElementById("coordinates-text").innerHTML == "") {
		return;
	}
	
	if (currentFormat == "geo") {
		currentFormat = "dms";
	} else if (currentFormat == "dms") {
		currentFormat = "utm";
	} else if (currentFormat == "utm") {
		currentFormat = "geo";
	}
	
	document.getElementById("coordinates-text").innerHTML = formatCoordinates();
}


