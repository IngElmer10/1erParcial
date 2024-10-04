class UMLRelationship {
    constructor(id, from, to, relationType) {
        this.id = id;
        this.from = from; // ID de la clase de origen
        this.to = to; // ID de la clase de destino
        this.relationType = relationType;
        this.type = 'UMLRelationship';
    }
    // Función para dibujar la relación
    draw(context, classes) {
        const fromClass = classes.find(c => c.id === this.from);
        const toClass = classes.find(c => c.id === this.to);

        if (fromClass && toClass) {
            // Calcular los puntos de intersección en los bordes
            const fromPoint = this.getIntersectionPoint(fromClass, toClass);
            const toPoint = this.getIntersectionPoint(toClass, fromClass);

            // Dibujar la línea desde el borde de la clase de origen al borde de la clase de destino
            context.beginPath();
            context.moveTo(fromPoint.x, fromPoint.y);
            context.lineTo(toPoint.x, toPoint.y);
            // Ajustar estilo según el tipo de relación
            

            context.stroke();
            this.drawRelationIndicator(context, fromPoint, toPoint);
        }
    }
    // Función para calcular el punto de intersección del borde
    getIntersectionPoint(fromClass, toClass) {
        const fromCenter = { x: fromClass.x + fromClass.width / 2, y: fromClass.y + fromClass.height / 2 };
        const toCenter = { x: toClass.x + toClass.width / 2, y: toClass.y + toClass.height / 2 };

        // Calcula el ángulo de la línea desde el centro de la clase de origen al centro de la clase de destino
        const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);

        // Calcular el punto de intersección en el borde de la clase de origen
        if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
            // Intersección en los lados izquierdo o derecho
            if (Math.cos(angle) > 0) {
                return { x: fromClass.x + fromClass.width, y: fromCenter.y + (fromClass.width / 2) * Math.tan(angle) };
            } else {
                return { x: fromClass.x, y: fromCenter.y - (fromClass.width / 2) * Math.tan(angle) };
            }
        } else {
            // Intersección en los lados superior o inferior
            if (Math.sin(angle) > 0) {
                return { x: fromCenter.x + (fromClass.height / 2) / Math.tan(angle), y: fromClass.y + fromClass.height };
            } else {
                return { x: fromCenter.x - (fromClass.height / 2) / Math.tan(angle), y: fromClass.y };
            }
        }
    }
    drawRelationIndicator(context, fromPoint, toPoint) {

        const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);

        // Dibujar la línea principal de la relación
        context.beginPath();
        context.moveTo(fromPoint.x, fromPoint.y);
        context.lineTo(toPoint.x, toPoint.y);
        context.stroke();

        // Selección de tipo de relación UML
        switch (this.relationType) {
            case 'association':
                // No se dibuja cabeza de flecha para asociación
                break;

            case 'inheritance':
                
            case 'realization':
                // Flecha vacía (herencia o realización)
                this.drawArrowHead(context, toPoint, angle, false);
                break;

            case 'dependency':
                // Flecha discontinua
                context.setLineDash([5, 5]); // Configurar línea discontinua
                context.moveTo(fromPoint.x, fromPoint.y);
                context.lineTo(toPoint.x, toPoint.y);
                context.stroke();
                context.setLineDash([]); // Restablecer línea continua
                this.drawArrowHead(context, toPoint, angle, true);
                break;

            case 'aggregation':
                // Rombo vacío
                this.drawDiamond(context, toPoint, angle, false);
                break;

            case 'composition':
                // Rombo relleno
                this.drawDiamond(context, toPoint, angle, true);
                break;

            default:
                // Otros tipos de relaciones
                break;
        }
    }
    // Método para dibujar la cabeza de la flecha
    drawArrowHead(context, toPoint, angle, filled = false) {
        const headlen = 20; // Longitud de la cabeza de la flecha
        context.beginPath();
        context.moveTo(toPoint.x, toPoint.y);
        context.lineTo(
            toPoint.x - headlen * Math.cos(angle - Math.PI / 6),
            toPoint.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        context.lineTo(
            toPoint.x - headlen * Math.cos(angle + Math.PI / 6),
            toPoint.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        context.closePath();

        // Rellenar si es necesario
        if (filled) {
            context.fillStyle = '#000000';
            context.fill();
        }
        context.stroke();
    }
    // Método para dibujar un rombo en el caso de agregación y composición
    drawDiamond(context, toPoint, angle, filled = false) {
        const diamondSize = 18; // Tamaño del rombo
        const diamondAngle = Math.PI / 3; // 45 grados para el ángulo del rombo

        context.beginPath();
        context.moveTo(toPoint.x, toPoint.y); // Punto principal del rombo
        context.lineTo(
            toPoint.x - diamondSize * Math.cos(angle - diamondAngle),
            toPoint.y - diamondSize * Math.sin(angle - diamondAngle)
        );
        context.lineTo(
            toPoint.x - diamondSize * Math.cos(angle),
            toPoint.y - diamondSize * Math.sin(angle)
        );
        context.lineTo(
            toPoint.x - diamondSize * Math.cos(angle + diamondAngle),
            toPoint.y - diamondSize * Math.sin(angle + diamondAngle)
        );
        context.closePath();

        // Rellenar si es composición
        if (filled) {
            context.fillStyle = '#000000';
            context.fill();
        }
        context.stroke();
    }

    generateXMI(xmlDoc) {
        if (this.relationType === 'inheritance') {
            // Generar una generalización (herencia)
            const generalizationElement = xmlDoc.createElement('UML:Generalization');
            generalizationElement.setAttribute('xmi.id', `EAID_${this.id}`);
            generalizationElement.setAttribute('subtype', `EAID_${this.from}`);  // Clase hija
            generalizationElement.setAttribute('supertype', `EAID_${this.to}`);  // Clase padre
            generalizationElement.setAttribute('visibility', 'public');

            // Agregar tagged values si es necesario
            const taggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
            generalizationElement.appendChild(taggedValues);

            return generalizationElement;
        } else if (['composition', 'aggregation', 'association'].includes(this.relationType)) {
            // Generar una asociación
            const associationElement = xmlDoc.createElement('UML:Association');
            associationElement.setAttribute('xmi.id', `EAID_${this.id}`);
            associationElement.setAttribute('visibility', 'public');
            associationElement.setAttribute('isRoot', 'false');
            associationElement.setAttribute('isLeaf', 'false');
            associationElement.setAttribute('isAbstract', 'false');

            // Tagged values para especificar el tipo de asociación
            const taggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
            const eaTypeTaggedValue = xmlDoc.createElement('UML:TaggedValue');
            eaTypeTaggedValue.setAttribute('tag', 'ea_type');
            eaTypeTaggedValue.setAttribute('value', this.relationType.charAt(0).toUpperCase() + this.relationType.slice(1));
            taggedValues.appendChild(eaTypeTaggedValue);
            associationElement.appendChild(taggedValues);

            // Asociación.connection
            const associationConnection = xmlDoc.createElement('UML:Association.connection');

            // Extremo fuente (desde)
            const associationEnd1 = xmlDoc.createElement('UML:AssociationEnd');
            associationEnd1.setAttribute('visibility', 'public');
            associationEnd1.setAttribute('isOrdered', 'false');
            associationEnd1.setAttribute('targetScope', 'instance');
            associationEnd1.setAttribute('changeable', 'none');
            associationEnd1.setAttribute('isNavigable', 'false');
            associationEnd1.setAttribute('type', `EAID_${this.from}`);

            // Establecer 'aggregation' en el extremo fuente
            if (this.relationType === 'composition') {
                associationEnd1.setAttribute('aggregation', 'composite');
            } else if (this.relationType === 'aggregation') {
                associationEnd1.setAttribute('aggregation', 'shared');
            } else {
                associationEnd1.setAttribute('aggregation', 'none');
            }

            // Agregar tagged values si es necesario
            const end1TaggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
            associationEnd1.appendChild(end1TaggedValues);

            // Extremo destino (hacia)
            const associationEnd2 = xmlDoc.createElement('UML:AssociationEnd');
            associationEnd2.setAttribute('visibility', 'public');
            associationEnd2.setAttribute('aggregation', 'none');
            associationEnd2.setAttribute('isOrdered', 'false');
            associationEnd2.setAttribute('targetScope', 'instance');
            associationEnd2.setAttribute('changeable', 'none');
            associationEnd2.setAttribute('isNavigable', 'true');
            associationEnd2.setAttribute('type', `EAID_${this.to}`);

            // Agregar tagged values si es necesario
            const end2TaggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
            associationEnd2.appendChild(end2TaggedValues);

            // Agregar los extremos a la conexión
            associationConnection.appendChild(associationEnd1);
            associationConnection.appendChild(associationEnd2);

            // Agregar la conexión a la asociación
            associationElement.appendChild(associationConnection);

            return associationElement;
        }

        // Si el tipo de relación no es reconocido, no se genera nada
        return null;
    }
}
