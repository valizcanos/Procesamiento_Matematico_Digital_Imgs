// TIPOS DE DATOS EN JS:
/*----------------------------------------------*/


// String o cadena

var a = "Hola";

// Numero

var Numero = 6;

// Booleanos

var bol = false;

// Nulos

var n = null;

// Indefinido

var indefinida;

// Faltantes

var NaNumb = 8*"b";

// Objeto

var perro = {
  nombre: "Pepe",
  raza: "dalmata",
  hijos: ["Pepito", "Pepita"],
  caracteristicas: {
    cabeza: "blanca",
    patas: 4},
  manchas: function(tamaño,porcentaje) {
  print("El perro tiene: ", tamaño * porcentaje, "manchas");
  } };

/*En este caso la colección de variable indica las propiedades
del objeto y la función representaria el método*/

print("El perro se llama: ", perro.nombre);
print("La raza del perro es: ",perro['raza']);
print("La cabeza del perro es: ",perro.caracteristicas.cabeza);
perro.manchas(10,49);

// Lista

var lista = [1,2,3];

print(lista[1]);

var lista2 = [true,4,"luna",[1,2,"a"],4, {d:4,h:2}];

print(lista2[3][2]);

// Funcion

function MiFuncion (pendiente, intercepcion, N){
  var y = pendiente*N + intercepcion;
  return y;
}

print(MiFuncion(0.5, 100, 4));



// OPERADORES:
/*----------------------------------------------*/

//Aritmeticos: + - * / %

print("suma",2+2);
print("resta",2-2);
print("producto",2*2);
print("division",2/2);
print("modulo",2%2);

//Relacionales: + - * / %


//Igualdad: 
//=== (Identidad): “igualdad”, comparación de tipo de dato y valor
//!== (No identidad): “desigualdad”


//Incremento/Decremento:
var i = 1;
i = i + 2;
i += 2;
i *= 2;

print(i);

//Operador unario:
print(i++);
print(i--);

//Lógicos:
/*
!(Not): Negación, lo que es verdadero lo vuelve falso y viceversa
&&(And): Cuando tengo 2 o más condiciones, todas tienen que ser verdaderas, para que la sentencia sea true
||(Or): Cuando tengo 2 o más condiciones, si una es verdadera, la sentencia es true
**/

print(!true);
print(6===6 && 1===3);
print(6===6 || 1===3);

//Condicionales:

var color = "azul";

if (color === "azul") {
  print("Azul es mi color favorito");
} else {
  print("Prefiero el azul");
}

//Loops

for (var n = 0; n < 5; n++) {
      print(n);
    }
    
var numeros = [10, 20, 30];

for (var a = 0; a < numeros.length; a++) {
      print(numeros[a]);
}

//TIPOS DE DATOS EN GOOGLE EARTH ENGINE
/*----------------------------------------------*/

/*En google earth engine encontramos datos como:
Image: archivo raster
ImageCollection: un stack o series temporales de imágenes
Geometry: archivo vectorial
Feature: geometry con un atributo
FeatureCollection: geometry con un grupo de atributos*/

/*Funciones como:
Filter: para filtrar datos o metadatos
Map: para visualizar y ejecutar loops
Reduce: aplicamos un reductor como máximos y mínimos*/


//Datos vectoriales

var rectangulo = ee.Geometry.Rectangle(-127.18, 19.39, 
-62.75, 51.29);


var LimitesAdm = ee.FeatureCollection("FAO/GAUL/2015/level2");
//https://developers.google.com/earth-engine/datasets/catalog/FAO_GAUL_2015_level2

var Colombia = LimitesAdm.filter(ee.Filter.eq('ADM0_NAME', 'Colombia'));
print("Colombia", Colombia);

var Cundinamarca = LimitesAdm.filter(ee.Filter.eq('ADM1_NAME',"Cundinamarca"));
var Bogota = LimitesAdm.filter(ee.Filter.eq('ADM2_NAME',"Santafe De Bogota D.c."));

function crearBuffer(f){
  return f.buffer(1000);
}

var cundinamarcaBuffer = Cundinamarca.map(crearBuffer);

var area = ee.FeatureCollection('USGS/WBD/2017/HUC06')
  .filterBounds(rectangulo);
// https://developers.google.com/earth-engine/datasets/catalog/USGS_WBD_2017_HUC06


var multi = Colombia.filter(ee.Filter.and(
  ee.Filter.gt("Shape_Area", 0.1),
  //ee.Filter.inList("ADM1_NAME", ["Cundinamarca"]),
  ee.Filter.inList("ADM1_NAME", ["Meta"])
  )
);



// Centrado y zoom del visor

//Map.setCenter(-80, 26.39,2);
//Map.centerObject(rectangulo,2);

//Visualizacion de capas

//Map.addLayer(rectangulo,{"color":"red"}, "Rectangulo");
//Map.addLayer(Bogota,{"color":"blue", "lineWidth":0.3}, "Bogota");
//Map.addLayer(Cundinamarca,{"color":"yellow", "lineWidth":0.3}, "Cundinamarca");
//Map.addLayer(cundinamarcaBuffer,{"color":"green"}, "Cundinamarca Buffer");
//Map.addLayer(area,{color: '808080',lineWidth: 1},"Cuencas");
Map.addLayer(multi, {color: "purple"}, "Multi_filtros");

//Reductores

var AreaCundi = Cundinamarca.reduceColumns({
  "reducer": ee.Reducer.mean(),
  "selectors":["Shape_Area"]
});
print(AreaCundi);

//Imagenes:

var dem = ee.Image("USGS/SRTMGL1_003");

var pendiente =  ee.Terrain.slope(dem);
var aspecto =  ee.Terrain.aspect(dem);

Map.addLayer(aspecto, {min: 0,
  max: 360,
  palette: [
    '3ae237', 'b5e22e', 'd6e21f', 'fff705', 'ffd611', 'ffb613', 'ff8b13',
    'ff6e08', 'ff500d', 'ff0000', 'de0101', 'c21301', '0602ff', '235cb1',
    '307ef3', '269db1', '30c8e2', '32d3ef', '3be285', '3ff38f', '86e26f'
  ]},"Aspecto");

Map.addLayer(pendiente, {
  min: 0,
  max: 90,
  palette: [
    '3ae237', 'b5e22e', 'd6e21f', 'fff705', 'ffd611', 'ffb613', 'ff8b13',
    'ff6e08', 'ff500d', 'ff0000', 'de0101', 'c21301', '0602ff', '235cb1',
    '307ef3', '269db1', '30c8e2', '32d3ef', '3be285', '3ff38f', '86e26f'
  ]},"Pendiente"); 
