var ls7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_TOA");
var zona = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-94.53148506662546, 29.895570993289862],
          [-94.56719063303171, 29.80028115525226],
          [-94.49165962717234, 29.616592602945765],
          [-94.22386787912546, 29.651208974475445],
          [-94.08241890451609, 29.704900468136987],
          [-94.12636421701609, 29.785979839478053],
          [-94.21013496896921, 29.857465971304684],
          [-94.39140938303171, 29.914618043430313]]]);

/*==============================================================================================*/
function removerNubes(img){
  var qa = img.select('QA_PIXEL');//Contiene información de cirrus y nubes
  var nubesBitMask = 1 << 3;
  var sombrasBitMask = 1 << 4;
  var mask = qa.bitwiseAnd(nubesBitMask).eq(0)
      .and(qa.bitwiseAnd(sombrasBitMask).eq(0)); 
  return img.updateMask(mask);
}

function recortarImagenes(img){
  return img.clip(zona);
}

var areaCultivo = ls7.filterDate("2010-01-01","2022-12-31").filterBounds(zona).map(removerNubes).map(recortarImagenes);

function NDVI(img){
  var ndvi = img.expression(
    "(NIR-RED)/(NIR+RED)",{
      "NIR":img.select("B4"),
      "RED":img.select("B3")
    }
    ).rename("NDVI");
  return img.addBands(ndvi).copyProperties(img,["system:time_start"]);
}

function EVI(img){
  var evi = img.expression(
    "2.5*(NIR-RED)/(NIR+6*RED-7.5*BLUE+1)",{
      "NIR":img.select("B4"),
      "RED":img.select("B3"),
      "BLUE":img.select("B1")
    }
    ).rename("EVI");
  return img.addBands(evi).copyProperties(img,["system:time_start"]);
}

function NDWI(img){
  var ndwi = img.expression(
    "(GREEN-NIR)/(GREEN+GREEN)",{
      "NIR":img.select("B4"),
      "GREEN":img.select("B2")
    }
    ).rename("NDWI");
  return img.addBands(ndwi).copyProperties(img,["system:time_start"]);
}

var Indices = areaCultivo.map(NDVI);
var Indices = Indices.map(EVI);
var Indices = Indices.map(NDWI);
//Visualizar
/*--------------------------------------------------------------------*/

Map.centerObject(zona);
Map.addLayer(areaCultivo,{"bands":["B4","B3","B2"],"min":0,"max":0.4, "gamma":1},"Area");
Map.addLayer(Indices.select("NDVI"),{"min":0, "max":1, palette:["#000000","#28ff08"]},"NDVI");
Map.addLayer(Indices.select("EVI"),{"min":0, "max":1, palette:["#000000","#28ff08"]},"EVI");
Map.addLayer(Indices.select("NDWI"),{"min":-1, "max":1, palette:["#000000","#28ff08"]},"NDWI");

//Graficos
/*--------------------------------------------------------------------*/

var indicesDOY = ui.Chart.image.doySeries({
  "imageCollection":Indices.select(["NDVI","EVI","NDWI"]), 
  "region":zona, 
  "regionReducer": ee.Reducer.mean(), 
  "scale":30, 
  "yearReducer":ee.Reducer.mean(), 
  "startDay":1, 
  "endDay":366}).setOptions({
    "lineWidth":1,
    "pointSize":2,
    "vAxis":{title:"Índices",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "hAxis":{title:"Días del año",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "series":{
      0: {color: 'red'},
      1:{color: 'green'},
      2:{color:'blue'}
    }
  });

print(indicesDOY);


var ndviDOY = ui.Chart.image.doySeries({
  "imageCollection":Indices.select(["NDVI"]), 
  "region":zona, 
  "regionReducer": ee.Reducer.mean(), 
  "scale":30, 
  "yearReducer":ee.Reducer.mean(), 
  "startDay":1, 
  "endDay":366}).setOptions({
    "lineWidth":1,
    "pointSize":2,
    "vAxis":{title:"NDVI",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "hAxis":{title:"Días del año",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "series":{
      0: {color: 'red'}
    }
  });

print(ndviDOY);

var seriesT = ui.Chart.image.series({
  "imageCollection":Indices.select(["NDVI","EVI","NDWI"]), 
  "region":zona, 
  "reducer": ee.Reducer.mean(), 
  "scale":30, 
  "xProperty":"system:time_start"}).setOptions({
    "lineWidth":1,
    "pointSize":2,
    "vAxis":{title:"ÍNDICES",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "hAxis":{title:"Fecha",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "series":{
      0: {color: 'red'},
      1:{color:'green'},
      2:{color:"blue"}
    }
  });
print(seriesT);