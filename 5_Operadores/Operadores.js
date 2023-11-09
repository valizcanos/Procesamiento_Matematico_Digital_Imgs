var coleccion = ee.ImageCollection("LANDSAT/LE7_L1T_32DAY_NDVI");

// Operadores: divide(), multiply(), add(), subtract()

var filtro2014 = coleccion.filterDate('2014-01-01', '2014-12-31').max();
var filtro2000 = coleccion.filterDate('2000-01-01', '2000-12-31').max();
var diferencia = filtro2000.subtract(filtro2014);

/*
Si el ndvi2000 – ndvi2014 > 0 la vegetación ha disminuido
Si el ndvi2000 – ndvi2014 < 0 la vegetación ha aumentado
*/

var condicion = diferencia.gt(0.3); //cambio extensivo

/*.gt() retorna 1 si el primer valor cumple con la condicion y 0 si no la cumple*/

Map.addLayer(diferencia, {"min":-0.64, "max":0.52, "palette":["288924","000000"]}, "Diferencia");

Map.addLayer(disminucion, {"min":0, "max":1, "palette":["000000","288924"]}, "Disminucion");

//z i = (x i – mínimo (x)) / (máximo (x) – mínimo (x))