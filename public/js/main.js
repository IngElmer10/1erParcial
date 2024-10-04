// Obtener elementos del DOM y contexto del canvas
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Conectar con el servidor Socket.IO
const socket = io();

// Variables de estado
let isDrawingClass = false;
let isDrawingRelationship = false;
let isDraggingClass = false;
let selectedClass = null;
let relationshipStartClass = null;
let selectedRelationshipType = null;
let offsetX, offsetY;

// Array para almacenar las clases y relaciones
let objetos = [];

// Obtener el ID de la pizarra y conectar con Socket.IO
const pizarraId = document.getElementById('pizarra_id').value;

// Enviar evento para unirse a una pizarra específica
socket.emit('unirse', { pizarraId: pizarraId });

// Escuchar eventos del servidor y actualizar el canvas
socket.on('dibujo', (data) => {
  const { pizarraId: id, objeto, objetos: objetosRecibidos, accion } = data;

  if (id === pizarraId) {
    switch (accion) {
      case 'agregar':
        objetos.push(deserializeObject(objeto));
        break;
      case 'mover':
        const index = objetos.findIndex(obj => obj.id === objeto.id);
        if (index !== -1) {
          objetos[index].x = objeto.x;
          objetos[index].y = objeto.y;
        }
        break;
      case 'eliminar':
        objetos = objetos.filter(obj => obj.id !== objeto.id);
        break;
      case 'actualizar':
        const idx = objetos.findIndex(obj => obj.id === objeto.id);
        if (idx !== -1) {
          objetos[idx] = deserializeObject(objeto);
        }
        break;
      case 'sincronizar':
        objetos = objetosRecibidos.map(obj => deserializeObject(obj));
        break;
      default:
        console.log(`Acción desconocida main: ${accion}`);
    }
    repaintCanvas();
  }
});

// Función para generar IDs únicos
function generateUniqueId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Función para redibujar el canvas
function repaintCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar las clases primero
  for (let obj of objetos) {
    if (obj.type === 'UMLClass') {
      obj.draw(context);
    }
  }

  // Dibujar las relaciones después
  for (let obj of objetos) {
    if (obj.type === 'UMLRelationship') {
      obj.draw(context, objetos.filter(o => o.type === 'UMLClass'));
    }
  }
}

// Función para enviar movimiento de un objeto al servidor
function emitObjectMove(object) {
  socket.emit('dibujo', {
    pizarraId: pizarraId,
    objeto: serializeObject(object),
    accion: 'mover'
  });
}

// Función para restablecer los estados de dibujo
function resetDrawingStates() {
  isDrawingClass = false;
  isDrawingRelationship = false;
  isDraggingClass = false;
  selectedClass = null;
  relationshipStartClass = null;
  canvas.style.cursor = 'default';
}

// Función para seleccionar una clase en base a las coordenadas del mouse
function selectClass(x, y) {
  for (let i = objetos.length - 1; i >= 0; i--) {
    const obj = objetos[i];
    if (obj.type === 'UMLClass') {
      if (
        x >= obj.x &&
        x <= obj.x + obj.width &&
        y >= obj.y &&
        y <= obj.y + obj.height
      ) {
        return obj;
      }
    }
  }
  return null;
}

// Manejo de eventos del canvas
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDrawingClass) {
    // Crear nueva clase UML
    const newClass = new UMLClass(generateUniqueId(), x, y, 'ClassName');
    objetos.push(newClass);
    repaintCanvas();

    // Emitir el nuevo objeto al servidor
    socket.emit('dibujo', {
      pizarraId: pizarraId,
      objeto: serializeObject(newClass),
      accion: 'agregar'
    });

    resetDrawingStates();
  } else if (isDrawingRelationship) {
    // Seleccionar clase de inicio para la relación
    const clickedClass = selectClass(x, y);
    if (clickedClass) {
      relationshipStartClass = clickedClass;
    }
  } else {
    // Seleccionar clase para moverla
    selectedClass = selectClass(x, y);
    if (selectedClass) {
      isDraggingClass = true;
      offsetX = x - selectedClass.x;
      offsetY = y - selectedClass.y;
      canvas.style.cursor = 'grabbing';
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDraggingClass && selectedClass) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedClass.x = x - offsetX;
    selectedClass.y = y - offsetY;
    repaintCanvas();

    // Emitir solo el cambio de posición del objeto seleccionado
    emitObjectMove(selectedClass);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (isDraggingClass) {
    isDraggingClass = false;
    selectedClass = null;
    canvas.style.cursor = 'default';
  } else if (isDrawingRelationship && relationshipStartClass) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedClass = selectClass(x, y);
    if (clickedClass && clickedClass !== relationshipStartClass) {
      // Crear nueva relación entre clases
      const newRelationship = new UMLRelationship(
        generateUniqueId(),
        relationshipStartClass.id,
        clickedClass.id,
        selectedRelationshipType
      );
      objetos.push(newRelationship);
      repaintCanvas();

      // Emitir el nuevo objeto al servidor
      socket.emit('dibujo', {
        pizarraId: pizarraId,
        objeto: serializeObject(newRelationship),
        accion: 'agregar'
      });
    }
    relationshipStartClass = null;
    resetDrawingStates();
  }
});

canvas.addEventListener('dblclick', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  selectedClass = selectClass(x, y);
  if (selectedClass) {
    // Mostrar modal y cargar datos de la clase
    document.getElementById('classModal').style.display = 'block';
    document.getElementById('className').value = selectedClass.name;
    document.getElementById('classAttributes').value = selectedClass.attributes.join('\n');
    document.getElementById('classMethods').value = selectedClass.methods.join('\n');
  }
});

// Manejadores para el modal de edición
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('classModal').style.display = 'none';
});

document.getElementById('saveClass').addEventListener('click', () => {
  if (selectedClass) {
    selectedClass.name = document.getElementById('className').value.trim() || 'ClassName';
    const attrs = document.getElementById('classAttributes').value.split('\n').map(attr => attr.trim()).filter(Boolean);
    const methods = document.getElementById('classMethods').value.split('\n').map(method => method.trim()).filter(Boolean);
    selectedClass.attributes = attrs;
    selectedClass.methods = methods;
    repaintCanvas();

    // Emitir la actualización de la clase al servidor
    socket.emit('dibujo', {
      pizarraId: pizarraId,
      objeto: serializeObject(selectedClass),
      accion: 'actualizar'
    });
  }
  document.getElementById('classModal').style.display = 'none';
});
// Función para manejar los botones de la barra de herramientas
function handleButtons() {
  // Botón para crear una clase UML
  document.getElementById('ClassButton').addEventListener('click', () => {
    resetDrawingStates();
    isDrawingClass = true;
    canvas.style.cursor = 'crosshair';
  });

  // Botón para crear una relación UML
  document.getElementById('RelationshipButton').addEventListener('click', () => {
    resetDrawingStates();
    isDrawingRelationship = true;
    selectedRelationshipType = document.getElementById('RelationshipType').value;
    canvas.style.cursor = 'crosshair';
  });

  // Botón para eliminar clases o relaciones
  document.getElementById('DelButton').addEventListener('click', () => {
    resetDrawingStates();
    canvas.addEventListener('mousedown', deleteElement, { once: true });
  });
}
/* ************************************************************* */

function downloadJavaFile(umlClass) {
  const entityClassCode = umlClass.generateEntityClass(); // Generar el código Java
  const blob = new Blob([entityClassCode], { type: 'text/plain' }); // Crear un Blob con el código
  const link = document.createElement('a'); // Crear un elemento temporal <a>
  link.href = URL.createObjectURL(blob);
  link.download = `${umlClass.name}.java`; // Nombre del archivo
  document.body.appendChild(link);
  link.click(); // Iniciar la descarga
  document.body.removeChild(link); // Limpiar el elemento
}
function downloadDTOFile(umlClass) {
  const dtoClassCode = umlClass.generateDTOClass(); // Generar el código Java del DTO
  const blob = new Blob([dtoClassCode], { type: 'text/plain' }); // Crear un Blob con el código
  const link = document.createElement('a'); // Crear un elemento temporal <a>
  link.href = URL.createObjectURL(blob);
  link.download = `${umlClass.name}DTO.java`; // Nombre del archivo
  document.body.appendChild(link);
  link.click(); // Iniciar la descarga
  document.body.removeChild(link); // Limpiar el elemento
}
function downloadRepositoryFile(umlClass) {
  const repositoryCode = umlClass.generateRepositoryInterface(); // Generar el código Java del Repository
  const blob = new Blob([repositoryCode], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${umlClass.name}Repository.java`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function downloadServiceFile(umlClass) {
  const serviceCode = umlClass.generateServiceClass(); // Generar el código Java del Service
  const blob = new Blob([serviceCode], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${umlClass.name}Service.java`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function downloadControllerFile(umlClass) {
  const controllerCode = umlClass.generateControllerClass(); // Generar el código Java del Controller
  const blob = new Blob([controllerCode], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${umlClass.name}Controller.java`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* *************************************************************************** */

// Agregar el event listener para el botón de descarga
document.getElementById('downloadJavaButton').addEventListener('click', () => {
  if (selectedClass) {
    downloadJavaFile(selectedClass);
    downloadDTOFile(selectedClass);
    downloadRepositoryFile(selectedClass);
    downloadServiceFile(selectedClass);
    downloadControllerFile(selectedClass);
  } else {
    alert('Por favor, selecciona una clase UML haciendo doble clic sobre ella antes de descargar.');
  }
});
// Agregar evento al botón de descarga de ZIP
document.getElementById('downloadZipButton').addEventListener('click', () => {
  // Redirigir al usuario a la ruta de descarga del ZIP
  window.location.href = '/download-zip';
});
/*  ************************************************************dddddddddddddddddd */
function exportarXMI() {
  const xmlDoc = document.implementation.createDocument(null, null, null);

  // Crear el elemento raíz XMI
  const xmiElement = xmlDoc.createElement('XMI');
  xmiElement.setAttribute('xmi.version', '1.1');
  xmiElement.setAttribute('xmlns:UML', 'omg.org/UML1.3');
  xmiElement.setAttribute('timestamp', new Date().toISOString());

  // XMI.header
  const xmiHeader = xmlDoc.createElement('XMI.header');
  const xmiDocumentation = xmlDoc.createElement('XMI.documentation');

  const exporter = xmlDoc.createElement('XMI.exporter');
  exporter.textContent = 'Diagramador UML';

  const exporterVersion = xmlDoc.createElement('XMI.exporterVersion');
  exporterVersion.textContent = '1.0';

  xmiDocumentation.appendChild(exporter);
  xmiDocumentation.appendChild(exporterVersion);
  xmiHeader.appendChild(xmiDocumentation);
  xmiElement.appendChild(xmiHeader);

  // XMI.content
  const xmiContent = xmlDoc.createElement('XMI.content');

  // Modelo UML
  const umlModel = xmlDoc.createElement('UML:Model');
  umlModel.setAttribute('name', 'EA Model');
  umlModel.setAttribute('xmi.id', `MX_${generateUniqueId()}`);

  const namespaceOwnedElement = xmlDoc.createElement('UML:Namespace.ownedElement');

  // Agregar clase raíz
  const rootClass = xmlDoc.createElement('UML:Class');
  rootClass.setAttribute('name', 'EARootClass');
  rootClass.setAttribute('xmi.id', 'EAID_11111111_5487_4080_A7F4_41526CB0AA00');
  rootClass.setAttribute('isRoot', 'true');
  rootClass.setAttribute('isLeaf', 'false');
  rootClass.setAttribute('isAbstract', 'false');
  namespaceOwnedElement.appendChild(rootClass);

  // Agregar paquete
  const umlPackage = xmlDoc.createElement('UML:Package');
  umlPackage.setAttribute('name', 'clases');
  umlPackage.setAttribute('xmi.id', `EAPK_${generateUniqueId()}`);
  umlPackage.setAttribute('visibility', 'public');
  umlPackage.setAttribute('isRoot', 'false');
  umlPackage.setAttribute('isLeaf', 'false');
  umlPackage.setAttribute('isAbstract', 'false');

  const packageTaggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
  umlPackage.appendChild(packageTaggedValues);

  const packageOwnedElements = xmlDoc.createElement('UML:Namespace.ownedElement');

  // Agregar clases (evitando duplicados)
  const uniqueClasses = new Set();
  objetos.filter(obj => obj.type === 'UMLClass').forEach(umlClass => {
    if (!uniqueClasses.has(umlClass.id)) {
      uniqueClasses.add(umlClass.id);
      const classElement = umlClass.generateXMI(xmlDoc);
      packageOwnedElements.appendChild(classElement);
    }
  });

  // Agregar relaciones (evitando duplicados)
  const uniqueRelations = new Set();
  objetos.filter(obj => obj.type === 'UMLRelationship').forEach(rel => {
    if (!uniqueRelations.has(rel.id)) {
      uniqueRelations.add(rel.id);
      const relElement = rel.generateXMI(xmlDoc);
      if (relElement) {
        packageOwnedElements.appendChild(relElement);
      }
    }
  });

  // Agregar tipos de datos (si es necesario)
  // ...

  umlPackage.appendChild(packageOwnedElements);
  namespaceOwnedElement.appendChild(umlPackage);
  umlModel.appendChild(namespaceOwnedElement);
  xmiContent.appendChild(umlModel);
  xmiElement.appendChild(xmiContent);

  xmlDoc.appendChild(xmiElement);

  // Serializar y descargar el XMI
  const serializer = new XMLSerializer();
  const xmiString = serializer.serializeToString(xmlDoc);

  const blob = new Blob([xmiString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'diagrama.xmi';
  link.click();
}
document.getElementById('exportXMIButton').addEventListener('click', exportarXMI);

/* *******************************************************************************  */


/* ******************************************************************************* */
// Función para eliminar clases o relaciones
function deleteElement(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedClass = selectClass(x, y);
  if (clickedClass) {
    objetos = objetos.filter(obj => obj.id !== clickedClass.id && obj.from !== clickedClass.id && obj.to !== clickedClass.id);
    repaintCanvas();

    // Emitir eliminación al servidor
    socket.emit('dibujo', {
      pizarraId: pizarraId,
      objeto: { id: clickedClass.id },
      accion: 'eliminar'
    });
  } else {
    const clickedRelationship = selectRelationship(x, y);
    if (clickedRelationship) {
      objetos = objetos.filter(obj => obj.id !== clickedRelationship.id);
      repaintCanvas();

      // Emitir eliminación al servidor
      socket.emit('dibujo', {
        pizarraId: pizarraId,
        objeto: { id: clickedRelationship.id },
        accion: 'eliminar'
      });
    }
  }
}

// Función para seleccionar una relación en base a las coordenadas del mouse
function selectRelationship(x, y) {
  for (let obj of objetos) {
    if (obj.type === 'UMLRelationship') {
      const fromClass = objetos.find(c => c.id === obj.from);
      const toClass = objetos.find(c => c.id === obj.to);

      if (!fromClass || !toClass) continue;

      const fromX = fromClass.x + fromClass.width / 2;
      const fromY = fromClass.y + fromClass.height / 2;
      const toX = toClass.x + toClass.width / 2;
      const toY = toClass.y + toClass.height / 2;

      // Calcular distancia del punto al segmento de línea (relación)
      const distance = Math.abs((toY - fromY) * x - (toX - fromX) * y + toX * fromY - toY * fromX) /
        Math.sqrt(Math.pow(toY - fromY, 2) + Math.pow(toX - fromX, 2));

      if (distance < 5) return obj;
    }
  }
  return null;
}

// Inicializar los manejadores de botones
handleButtons();

// Función para serializar un objeto antes de enviarlo al servidor
function serializeObject(obj) {
  if (obj.type === 'UMLClass') {
    return {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      name: obj.name,
      attributes: obj.attributes,
      methods: obj.methods,
      width: obj.width,
      height: obj.height,
      type: obj.type
    };
  } else if (obj.type === 'UMLRelationship') {
    return {
      id: obj.id,
      from: obj.from,
      to: obj.to,
      relationType: obj.relationType,
      type: obj.type
    };
  } else {
    return obj; // Otros tipos de objetos
  }
}

// Función para deserializar objetos recibidos del servidor
function deserializeObject(obj) {
  if (obj.type === 'UMLClass') {
    return new UMLClass(obj.id, obj.x, obj.y, obj.name, obj.attributes, obj.methods);
  } else if (obj.type === 'UMLRelationship') {
    return new UMLRelationship(obj.id, obj.from, obj.to, obj.relationType);
  } else {
    return obj;
  }
}

// Ajustar el tamaño del canvas para ser más amigable
function adjustCanvasSize() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.8;
  repaintCanvas();
}

// Inicializar el tamaño del canvas
adjustCanvasSize();

// Ajustar el tamaño del canvas al redimensionar la ventana
window.addEventListener('resize', () => {
  adjustCanvasSize();
});

// Botón para guardar el diagrama en el servidor
document.getElementById('saveButton').addEventListener('click', () => {
  const objetosJson = serializeObjetos(objetos); // Convertir los objetos a JSON

  fetch('/guardarDiagrama', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pizarraId: pizarraId,
      objetos: objetosJson
    })
  })
    .then(response => response.text())
    .then(data => {
      alert(data); // Mostrar mensaje de éxito o error
    })
    .catch(error => {
      console.error('Error al guardar el diagrama:', error);
    });
});

// Cargar los objetos existentes al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  const objetosJson = document.getElementById('objetos').value;
  const parsedObjetos = JSON.parse(objetosJson);

  objetos = parsedObjetos.map(obj => deserializeObject(obj));

  repaintCanvas(); // Repintar el canvas con los objetos cargados
});

// Función para serializar un array de objetos
function serializeObjetos(objetosArray) {
  return objetosArray.map(obj => serializeObject(obj));
}
