// Función para exportar el diagrama como una imagen (PNG o JPEG)
document.getElementById('exportImageButton').addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    // Cambiar el color de las líneas y el texto antes de exportar
    context.strokeStyle = 'black';  // Cambiar el color de las líneas a negro
    context.fillStyle = 'white';    // Cambiar el color del texto a negro

    repaintCanvas();  // Suponiendo que esta función redibuja el diagrama

    // Convertir el canvas a una URL de imagen (base64)
    const imageData = canvas.toDataURL(`image/png`);

    // Crear un enlace temporal para descargar la imagen
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `diagrama.png`;  // Nombre del archivo con el formato seleccionado
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    context.fillStyle = 'black';    // Cambiar el color del texto a negro

});

// Definir los estilos predefinidos
const estilos = {
    default: {
        backgroundColor: '#ffffff', // Fondo blanco
        lineColor: '#000000',       // Líneas negras
        textColor: '#000000'        // Texto negro
    },
    darkMode: {
        backgroundColor: '#2c2c2c', // Fondo gris oscuro
        lineColor: '#ffffff',       // Líneas blancas
        textColor: '#ffffff'        // Texto blanco
    },
    lightMode: {
        backgroundColor: '#f0f0f0', // Fondo gris claro
        lineColor: '#333333',       // Líneas grises
        textColor: '#333333'        // Texto gris oscuro
    },
    blueprint: {
        backgroundColor: '#1c2f90', // Fondo azul
        lineColor: '#ffffff',       // Líneas blancas
        textColor: '#ffffff'        // Texto blanco
    }
};

// Función para aplicar el estilo seleccionado al canvas
function aplicarEstilo(estilo) {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    // Obtener el estilo seleccionado
    const selectedStyle = estilos[estilo];

    // Cambiar el color del fondo del canvas
    canvas.style.backgroundColor = selectedStyle.backgroundColor;

    // Cambiar el color de las líneas y del texto
    context.strokeStyle = selectedStyle.lineColor;
    context.fillStyle = selectedStyle.textColor;

    // Redibujar el canvas con los nuevos colores
    repaintCanvas();
}

// Event listener para el selector de estilos
document.getElementById('styleSelector').addEventListener('change', function () {
    const estiloSeleccionado = this.value;
    aplicarEstilo(estiloSeleccionado);
});

document.getElementById('inputXMI').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        importarXMI(file);
    } else {
        alert('No se seleccionó ningún archivo.');
    }
});


async function importarXMI(file) {
    try {
        const xmiString = await leerArchivoXMI(file);
        const xmlDoc = parseXMI(xmiString);

        // Extraer clases y relaciones
        const classes = extractClasses(xmlDoc);
        const classMap = mapClassesById(classes);
        extractClassPositions(xmlDoc, classes);
        extractClassFeatures(xmlDoc, classMap);

        const relationships = extractRelationships(xmlDoc);
        linkRelationships(relationships, classMap);
        linkAssociationClasses(relationships, classMap);

        // Representar en el lienzo
        drawDiagram(classes, relationships);

        // Agregar las clases y relaciones al arreglo global de objetos
        objetos = [...classes, ...relationships];

        console.log('Importación completada exitosamente.');
    } catch (error) {
        console.error('Error al importar el archivo XMI:', error);
        alert('Ocurrió un error al importar el archivo XMI. Por favor, verifica que el archivo sea válido y esté en el formato correcto.');
    }
}
function leerArchivoXMI(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            resolve(event.target.result);
        };
        reader.onerror = function (event) {
            reject(new Error('No se pudo leer el archivo.'));
        };
        reader.readAsText(file, 'UTF-8'); // Especificamos UTF-8 para manejar correctamente la codificación de caracteres
    });
}
function parseXMI(xmiString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmiString, 'application/xml');

    // Verificar si hubo errores en el parseo
    const parserErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
        throw new Error('Error al parsear el archivo XMI.');
    }

    return xmlDoc;
}
function extractClasses(xmlDoc) {
    const classElements = xmlDoc.getElementsByTagName('UML:Class');
    const classes = [];

    for (let i = 0; i < classElements.length; i++) {
        const classElement = classElements[i];
        const id = classElement.getAttribute('xmi.id');
        const name = classElement.getAttribute('name') || 'ClaseSinNombre';

        // Manejo de IDs faltantes
        if (!id) {
            console.warn('Clase sin xmi.id encontrada. Se omitirá esta clase.');
            continue;
        }

        // Crear objeto UMLClass (asegúrate de tener una clase UMLClass)
        const umlClass = new UMLClass(id, 0, 0, name, [], []);
        classes.push(umlClass);
    }

    return classes;
}
function mapClassesById(classes) {
    const classMap = {};
    classes.forEach(cls => {
        if (cls.id) {
            classMap[cls.id] = cls;
        }
    });
    return classMap;
}
function extractClassPositions(xmlDoc, classes) {
    const diagramElements = xmlDoc.getElementsByTagName('UML:DiagramElement');
    const classMap = mapClassesById(classes);

    for (let i = 0; i < diagramElements.length; i++) {
        const diagramElement = diagramElements[i];
        const subject = diagramElement.getAttribute('subject');
        const geometry = diagramElement.getAttribute('geometry');

        if (subject && geometry && classMap[subject]) {
            const coords = parseGeometry(geometry);
            const umlClass = classMap[subject];
            umlClass.x = coords.Left || 0;
            umlClass.y = coords.Top || 0;
            umlClass.width = (coords.Right - coords.Left) || 100;
            umlClass.height = (coords.Bottom - coords.Top) || 50;
        }
    }
}
function parseGeometry(geometryString) {
    const coords = {};
    const parts = geometryString.split(';');
    parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
            coords[key] = parseInt(value, 10);
        }
    });
    return coords;
}
function extractClassFeatures(xmlDoc, classMap) {
    const classElements = xmlDoc.getElementsByTagName('UML:Class');

    for (let i = 0; i < classElements.length; i++) {
        const classElement = classElements[i];
        const classId = classElement.getAttribute('xmi.id');

        if (classId && classMap[classId]) {
            const umlClass = classMap[classId];
            const features = classElement.getElementsByTagName('UML:Classifier.feature');

            for (let j = 0; j < features.length; j++) {
                const feature = features[j];

                // Procesar atributos
                const attributes = feature.getElementsByTagName('UML:Attribute');
                for (let k = 0; k < attributes.length; k++) {
                    const attribute = attributes[k];
                    const attrName = attribute.getAttribute('name') || 'atributoSinNombre';
                    umlClass.attributes.push(attrName);
                }

                // Procesar métodos
                const methods = feature.getElementsByTagName('UML:Operation');
                for (let k = 0; k < methods.length; k++) {
                    const method = methods[k];
                    const methodName = method.getAttribute('name') || 'metodoSinNombre';
                    umlClass.methods.push(methodName);
                }
            }
        }
    }
}
function extractRelationships(xmlDoc) {
    const relationships = [];

    // Procesar asociaciones
    const associationElements = xmlDoc.getElementsByTagName('UML:Association');
    for (let i = 0; i < associationElements.length; i++) {
        const associationElement = associationElements[i];
        const id = associationElement.getAttribute('xmi.id');

        if (!id) {
            console.warn('Asociación sin xmi.id encontrada. Se omitirá.');
            continue;
        }

        const associationEnds = associationElement.getElementsByTagName('UML:AssociationEnd');
        if (associationEnds.length >= 2) {
            const fromEnd = associationEnds[0];
            const toEnd = associationEnds[1];

            const fromId = fromEnd.getAttribute('type');
            const toId = toEnd.getAttribute('type');

            if (!fromId || !toId) {
                console.warn(`Asociación con extremos faltantes en xmi.id ${id}. Se omitirá.`);
                continue;
            }

            // Determinar el tipo de relación
            let relationType = 'association'; // Valor por defecto
            const fromAggregation = fromEnd.getAttribute('aggregation');
            const toAggregation = toEnd.getAttribute('aggregation');

            if (fromAggregation === 'composite' || toAggregation === 'composite') {
                relationType = 'composition';
            } else if (fromAggregation === 'shared' || toAggregation === 'shared') {
                relationType = 'aggregation';
            }

            // Crear objeto UMLRelationship
            const relationship = new UMLRelationship(id, fromId, toId, relationType);
            relationships.push(relationship);
        } else {
            console.warn(`Asociación con menos de dos extremos en xmi.id ${id}. Se omitirá.`);
        }
    }

    // Procesar generalizaciones
    const generalizationElements = xmlDoc.getElementsByTagName('UML:Generalization');
    for (let i = 0; i < generalizationElements.length; i++) {
        const generalizationElement = generalizationElements[i];
        const id = generalizationElement.getAttribute('xmi.id');

        if (!id) {
            console.warn('Generalización sin xmi.id encontrada. Se omitirá.');
            continue;
        }

        const subtypeId = generalizationElement.getAttribute('subtype');
        const supertypeId = generalizationElement.getAttribute('supertype');

        if (!subtypeId || !supertypeId) {
            console.warn(`Generalización con extremos faltantes en xmi.id ${id}. Se omitirá.`);
            continue;
        }

        // Crear objeto UMLRelationship
        const relationship = new UMLRelationship(id, subtypeId, supertypeId, 'inheritance');
        relationships.push(relationship);
    }

    return relationships;
}


function linkRelationships(relationships, classMap) {
    relationships.forEach(rel => {
        rel.fromClass = classMap[rel.from];
        rel.toClass = classMap[rel.to];

        if (!rel.fromClass || !rel.toClass) {
            console.warn(`Relación xmi.id ${rel.id} tiene clases faltantes. Se omitirá.`);
            // Eliminar la relación de la lista
            relationships.splice(relationships.indexOf(rel), 1);
        }
    });
}

function linkAssociationClasses(relationships, classMap) {
    relationships.forEach(rel => {
        if (rel.relationType === 'associationClass' && rel.associationClassId) {
            const associationClass = classMap[rel.associationClassId];
            if (associationClass) {
                rel.associationClass = associationClass;
            } else {
                console.warn(`Asociación de clase con xmi.id ${rel.associationClassId} no encontrada para la relación xmi.id ${rel.id}.`);
            }
        }
    });
}
function drawDiagram(classes, relationships) {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('No se encontró el elemento canvas con id "miCanvas".');
        return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
        console.error('No se pudo obtener el contexto 2D del canvas.');
        return;
    }

    // Limpiar el lienzo
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar clases
    classes.forEach(cls => {
        if (typeof cls.draw === 'function') {
            cls.draw(context);
        } else {
            console.warn(`La clase con xmi.id ${cls.id} no tiene un método draw.`);
        }
    });

    // Dibujar relaciones
    relationships.forEach(rel => {
        if (typeof rel.draw === 'function') {
            rel.draw(context, classes);
        } else {
            console.warn(`La relación con xmi.id ${rel.id} no tiene un método draw.`);
        }
    });
}


