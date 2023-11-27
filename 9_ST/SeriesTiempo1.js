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

var ls7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_TOA");

/*================================================================================================*/
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
//Map.addLayer(areaCultivo,{"bands":["B4","B3","B2"],"min":0,"max":0.4, "gamma":1},"Area");
//Map.addLayer(Indices.select("NDVI"),{"min":0, "max":1, palette:["#000000","#28ff08"]},"NDVI");
//Map.addLayer(Indices.select("EVI"),{"min":0, "max":1, palette:["#000000","#28ff08"]},"EVI");
//Map.addLayer(Indices.select("NDWI"),{"min":-1, "max":1, palette:["#000000","#28ff08"]},"NDWI");

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

var ndviST = ui.Chart.image.series(Indices.select("NDVI"), zona).
  setChartType('ScatterChart').setOptions({
    trendlines: {0: {
        color: 'CC0000'
      }},
      "pointSize":1,
      "vAxis":{title:"NDVI",  titleTextStyle:{fontName: 'arial', fontSize: 16, italic: false, bold: true}},
    "hAxis":{title:"Fecha",  titleTextStyle:{fontName: 'arial', fontSize: 16, italic: false, bold: true}}
  });

print(ndviST);


//Modelo armónico
/*--------------------------------------------------------------------*/

var contador = Indices.select("NDVI").size();  // Obtiene el número de imágenes en la colección
var lista = Indices.select("NDVI").toList(contador); // Convierte la colección de imagenes a una lista

print("Numero de imagenes:", contador);
// Iteramos para obtener las fechas de cada imagen
for (var i = 0; i < 682; i++) {
    var imagen = ee.Image(lista.get(i));
    var fecha = ee.Date(imagen.get('system:time_start'));
    var anios = fecha.difference(ee.Date("2010-01-01"),"year");
    //print('Fecha de la imagen ', i, ':', fecha);
    //print('Diferencia de años de cada imagen ', i, ':', anios);
}

//Función para crear bandas con las fechas de la colección de índices
function TiemposVarImg(img){
  var tiempos = ee.Date(img.get('system:time_start'));
  var anios = tiempos.difference(ee.Date("2010-01-01"),"year");
  return img.addBands(ee.Image(anios).rename("t")).float().
    addBands(ee.Image.constant(1));
}

//Agregar bandas de tiempo y constante a la colección de índices
var IndicesVarT = Indices.map(TiemposVarImg);
print("Tiempos: ", IndicesVarT.select("t"));
print("Constante: ", IndicesVarT.select("constant"));

//Regresión armónica: pt = β0 + β1t + β2cos(2πωt) + β3sin(2πωt) + et

// Definir las variables dependiente e independiente para la regresión armónica.
var Independientes = ee.List(['constant', 't', 'cos', 'sin']);
var dependientes = ee.String('NDVI');

// Agregar los términos del armónico a una nueva banda
var ls07Armonico = IndicesVarT.map(function(image) {
  var tiempoEnRadianes = image.select('t').multiply(2 * Math.PI);////2πωt, w se asume como 1 que sería el equivalente a un ciclo por unidad de tiempo (2*PI/tiempo)
  return image
    .addBands(tiempoEnRadianes.cos().rename('cos')) //cos(2πωt)
    .addBands(tiempoEnRadianes.sin().rename('sin')); //sin(2πωt)
});


var TendenciaArmonico = ls07Armonico
  .select(Independientes.add(dependientes)) //crea la siguiente lista ["constant","t","cos","sin","NDVI"]
  // La salida de este reductor es un arreglo de imagen de 4x1
  .reduce(ee.Reducer.linearRegression({ //Crea un reductor que calcula una regresión lineal de mínimos cuadrados con numX variables independientes y numY variables dependientes.
    numX: Independientes.length(), // 4 variables independientes ['constant', 't', 'cos', 'sin']
    numY: 1
  }));

//Los coeficientes  β0 + β1 + β2 + β3 se encuentran almacenados en la banda "coefficients"
//Los residuales (et) se encuentran almacenados en la banda "residuals"


//Map.addLayer(TendenciaArmonico.select('coefficients'),{},"Coeficientes");
print("coeficientes: ",TendenciaArmonico.select('coefficients') );

// Convertir un arreglo de imagen en una imagen multibanda de coeficientes
var coeficientesTendencia = TendenciaArmonico.select('coefficients')
  .arrayProject([0]) //Almacena los coeficiente β0, β1, β2, y β3 los cuales definimos para las variables "constant","t","cos","sin"
  .arrayFlatten([Independientes]); //función de aplanado

//Map.addLayer(coeficientesTendencia,{},"Coeficientes tendencias");

// Compute fitted values.
var aplicarArmonico = ls07Armonico.map(function(image) {
  return image.addBands(
    image.select(Independientes) //"constant","t","cos","sin"
      .multiply(coeficientesTendencia)// β0*"constant", β1*"t", β2*"cos",  β3*"sin"
      .reduce('sum')// β0*"constant"+ β1*"t"+ β2*"cos"+  β3*"sin"
      .rename('NDVI_ajustado'));
});

//Map.addLayer(aplicarArmonico.select('NDVI_ajustado'),{},"Armónico para NDVI");

// Plot the fitted model and the original data at the ROI.
print(ui.Chart.image.series(
aplicarArmonico.select(['NDVI_ajustado','NDVI']), zona, ee.Reducer.mean(), 30)
    .setSeriesNames(['NDVI', 'Ajustado'])
    .setOptions({
      title: 'Modelo armónico: valores de NDVI reales y ajustados',
      lineWidth: 1,
      pointSize: 3,
}));