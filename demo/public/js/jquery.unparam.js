/*!
 * @name jQuery.unparam v1.0
 * @autor yeikos
 
 * Copyright 2012 - https://github.com/yeikos/jquery.unparam
 * GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.txt
 */

;(function($) {

	$.unparam = function(input) {

		var items, temp,

		// Expresiones regulares

			expBrackets = /\[(.*?)\]/g,
			expVarname = /(.+?)\[/,

		// Contenedor para almacenar el resultado

			result = {};

		// Descartamos entradas que no sean cadenas de texto o se encuentren vacías

		if ((temp = $.type(input)) != 'string' || (temp == 'string' && !temp.length))

			return {};

		// Decodificamos la entrada y la dividimos en bloques

		items = decodeURIComponent(input).split('&');

		// Es necesario que los datos anteriores no se encuentren vacíos

		if (!(temp = items.length) || (temp == 1 && temp === ''))

			return result;

		// Recorremos los datos

		$.each(items, function(index, item) {

			// Es necesario que no se encuentre vacío

			if (!item.length)

				return;

			// Iniciamos la divisón por el caracter =

			temp = item.split('=');

			// Obtenemos el nombre de la variable

			var key = temp.shift(),

			// Y su valor

				value = temp.join('=').replace(/\+/g, ' '),

				size, link, subitems = [];

			// Es necesario que el nombre de la clave no se encuentre vacío

			if (!key.length)

				return;

			// Comprobamos si el nombre de la clave tiene anidaciones

			while((temp = expBrackets.exec(key)))

				subitems.push(temp[1]);

			// Si no tiene anidaciones

			if (!(size = subitems.length)) {

				// Guardamos el resultado directamente

				result[key] = value;

				// Continuamos con el siguiente dato

				return;

			}

			// Decrementamos el tamaño de las anidaciones para evitar repetidas restas

			size--;

			// Obtenemos el nombre real de la clave con anidaciones

			temp = expVarname.exec(key);

			// Es necesario que se encuentre y que no esté vacío

			if (!temp || !(key = temp[1]) || !key.length)

				return;

			// Al estar todo correcto, comprobamos si el contenedor resultante es un objecto

			if ($.type(result[key]) != 'object')

				// Si no lo es forzamos a que lo sea

				result[key] = {};

			// Creamos un enlace hacia el contenedor para poder reccorrerlo a lo largo de la anidación

			link = result[key];

			// Recorremos los valores de la anidación
			
			$.each(subitems, function(subindex, subitem) {

				// Si el nombre de la clave se encuentra vacío (varname[])

				if (!(temp = subitem).length) {

					temp = 0;

					// Recorremos el enlace actual

					$.each(link, function(num) {
			
						// Si el índice es un número entero, positivo y mayor o igual que el anterior

						if (!isNaN(num) && num >= 0 && (num%1 === 0) && num >= temp)

							// Guardamos dicho número y lo incrementamos en uno

							temp = Number(num)+1;

					});

				}

				// Si se llegó al final de la anidación

				if (subindex == size) {

					// Establecemos el valor en el enlace

					link[temp] = value;

				} else if ($.type(link[temp]) != 'object') { // Si la anidación no existe

					// Se crea un objeto con su respectivo enlace

					link = link[temp] = {};

				} else { // Si la anidación existe

					// Cambiamos el enlace sin sobreescribir datos

					link = link[temp];

				}

			});

		});

		// Retornamos el resultado en forma de objeto

		return result;

	};

})(jQuery);