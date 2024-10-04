class UMLClass {
  constructor(id, x, y, name = 'ClassName', attributes = [], methods = []) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.name = name;
    this.attributes = attributes;
    this.methods = methods;
    this.width = 150;
    this.height = 100; // Ajusta el tamaño según sea necesario
    this.type = 'UMLClass';
  }

  // Método para dibujar la clase UML
  draw(context) {
    context.strokeRect(this.x, this.y, this.width, this.height);
    context.textAlign = 'center';

    // Dibujar el nombre de la clase
    context.fillText(this.name, this.x + this.width / 2, this.y + 15);

    // Dibujar los atributos
    context.textAlign = 'left';
    let attributesY = this.y + 35;
    for (let attribute of this.attributes) {
      context.fillText(attribute, this.x + 5, attributesY);
      attributesY += 15;
    }

    // Dibujar los métodos
    let methodsY = attributesY + 10;
    for (let method of this.methods) {
      context.fillText(method, this.x + 5, methodsY);
      methodsY += 15;
    }

    // Divisiones dentro de la clase
    context.beginPath();
    context.moveTo(this.x, this.y + 20); // Línea divisoria para el nombre
    context.lineTo(this.x + this.width, this.y + 20);
    context.moveTo(this.x, attributesY); // Línea divisoria para atributos
    context.lineTo(this.x + this.width, attributesY);
    context.stroke();
  }
  // Método para generar la clase Entity en formato Java
  generateEntityClass() {
    const className = this.name;
    let entityClass = `package com.example.demo.entity;\n\n`;
    entityClass += `import jakarta.persistence.Entity;\nimport jakarta.persistence.GeneratedValue;\nimport jakarta.persistence.GenerationType;\nimport lombok.AllArgsConstructor;\nimport lombok.NoArgsConstructor;\n  import jakarta.persistence.Id;\n\n`;
    entityClass += `@AllArgsConstructor  // genera el constructor con parametros\n`;
    entityClass += `@NoArgsConstructor // genera el contructor sin parametro\n`;
    entityClass += `@Entity\n`;
    entityClass += `public class ${className} {\n\n`;
    entityClass += `    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n`;

    // Generar los atributos
    for (let attribute of this.attributes) {
      const [attrName, attrType] = attribute.split(':').map(s => s.trim());
      const javaType = this.getJavaType(attrType);
      entityClass += `    private ${javaType} ${attrName};\n`;
    }
    entityClass += `\n`;

    // Generar getters y setters
    for (let attribute of this.attributes) {
      const [attrName, attrType] = attribute.split(':').map(s => s.trim());
      const javaType = this.getJavaType(attrType);
      const capitalizedAttr = attrName.charAt(0).toUpperCase() + attrName.slice(1);

      // Getter
      entityClass += `    public ${javaType} get${capitalizedAttr}() {\n`;
      entityClass += `        return this.${attrName};\n`;
      entityClass += `    }\n\n`;

      // Setter
      entityClass += `    public void set${capitalizedAttr}(${javaType} ${attrName}) {\n`;
      entityClass += `        this.${attrName} = ${attrName};\n`;
      entityClass += `    }\n\n`;
    }

    entityClass += `}`;
    return entityClass;
  }
  // Método auxiliar para obtener el tipo de dato en Java
  getJavaType(type) {
    switch (type ? type.toLowerCase() : '') {
      case 'int':
      case 'integer':
        return 'int';
      case 'string':
        return 'String';
      case 'boolean':
        return 'boolean';
      case 'float':
        return 'float';
      case 'double':
        return 'double';
      case 'long':
        return 'long';
      default:
        return 'String'; // Tipo por defecto
    }
  }
  // Método para generar la clase DTO
  generateDTOClass() {
    const className = this.name + 'DTO';
    let dtoClass = `package com.example.demo.dto;\n\n`;
    dtoClass += `public class ${className} {\n\n`;

    // Generar los atributos
    for (let attribute of this.attributes) {
      const [attrName, attrType] = attribute.split(':').map(s => s.trim());
      const javaType = this.getJavaType(attrType);
      dtoClass += `    private ${javaType} ${attrName};\n`;
    }
    dtoClass += `\n`;

    // Generar getters y setters
    for (let attribute of this.attributes) {
      const [attrName, attrType] = attribute.split(':').map(s => s.trim());
      const javaType = this.getJavaType(attrType);
      const capitalizedAttr = attrName.charAt(0).toUpperCase() + attrName.slice(1);

      // Getter
      dtoClass += `    public ${javaType} get${capitalizedAttr}() {\n`;
      dtoClass += `        return this.${attrName};\n`;
      dtoClass += `    }\n\n`;

      // Setter
      dtoClass += `    public void set${capitalizedAttr}(${javaType} ${attrName}) {\n`;
      dtoClass += `        this.${attrName} = ${attrName};\n`;
      dtoClass += `    }\n\n`;
    }

    dtoClass += `}`;
    return dtoClass;
  }
  // Método para generar la interfaz Repository
  generateRepositoryInterface() {
    const className = this.name;
    let repositoryInterface = `package com.example.demo.repository;\n\n`;
    repositoryInterface += `import com.example.demo.entity.${className};\n`;
    repositoryInterface += `import org.springframework.stereotype.Repository;\n`;
    repositoryInterface += `import org.springframework.data.jpa.repository.JpaRepository;\n\n`;

    repositoryInterface += `@Repository\n`;
    repositoryInterface += `public interface ${className}Repository extends JpaRepository<${className}, Long> {\n`;
    repositoryInterface += `    // Métodos personalizados si es necesario\n`;
    repositoryInterface += `}`;
    return repositoryInterface;
  }
  // Método para generar la clase Service
  generateServiceClass() {
    const className = this.name;
    const dtoClassName = className + 'DTO';
    let serviceClass = `package com.example.demo.service;\n\n`;
    serviceClass += `import com.example.demo.dto.${dtoClassName};\n`;
    serviceClass += `import com.example.demo.entity.${className};\n`;
    serviceClass += `import com.example.demo.repository.${className}Repository;\n`;
    serviceClass += `import org.springframework.beans.factory.annotation.Autowired;\n`;
    serviceClass += `import org.springframework.stereotype.Service;\n\n`;
    serviceClass += `import java.util.List;\n`;
    serviceClass += `import java.util.Optional;\n`;
    serviceClass += `import java.util.stream.Collectors;\n\n`;
    serviceClass += `@Service\n`;
    serviceClass += `public class ${className}Service {\n\n`;
    serviceClass += `    @Autowired\n`;
    serviceClass += `    private ${className}Repository ${this.toCamelCase(className)}Repository;\n\n`;

    // Método para obtener todos los registros
    serviceClass += `    public List<${dtoClassName}> getAll${className}s() {\n`;
    serviceClass += `        return ${this.toCamelCase(className)}Repository.findAll()\n`;
    serviceClass += `                .stream()\n`;
    serviceClass += `                .map(this::convertToDTO)\n`;
    serviceClass += `                .collect(Collectors.toList());\n`;
    serviceClass += `    }\n\n`;

    // Método para obtener un registro por id
    serviceClass += `    public Optional<${dtoClassName}> get${className}ById(Long id) {\n`;
    serviceClass += `        return ${this.toCamelCase(className)}Repository.findById(id)\n`;
    serviceClass += `                .map(this::convertToDTO);\n`;
    serviceClass += `    }\n\n`;

    // Método para crear un nuevo registro
    serviceClass += `    public ${dtoClassName} create${className}(${dtoClassName} ${this.toCamelCase(dtoClassName)}) {\n`;
    serviceClass += `        ${className} entity = convertToEntity(${this.toCamelCase(dtoClassName)});\n`;
    serviceClass += `        ${className} savedEntity = ${this.toCamelCase(className)}Repository.save(entity);\n`;
    serviceClass += `        return convertToDTO(savedEntity);\n`;
    serviceClass += `    }\n\n`;

    // Método para actualizar un registro por id
    serviceClass += `    public Optional<${dtoClassName}> update${className}(Long id, ${dtoClassName} ${this.toCamelCase(dtoClassName)}) {\n`;
    serviceClass += `        return ${this.toCamelCase(className)}Repository.findById(id)\n`;
    serviceClass += `                .map(existing -> {\n`;
    for (let attribute of this.attributes) {
      const [attrName] = attribute.split(':').map(s => s.trim());
      const capitalizedAttr = attrName.charAt(0).toUpperCase() + attrName.slice(1);
      serviceClass += `                    existing.set${capitalizedAttr}(${this.toCamelCase(dtoClassName)}.get${capitalizedAttr}());\n`;
    }
    serviceClass += `                    return ${this.toCamelCase(className)}Repository.save(existing);\n`;
    serviceClass += `                }).map(this::convertToDTO);\n`;
    serviceClass += `    }\n\n`;

    // Método para eliminar un registro por id
    serviceClass += `    public void delete${className}ById(Long id) {\n`;
    serviceClass += `        ${this.toCamelCase(className)}Repository.deleteById(id);\n`;
    serviceClass += `    }\n\n`;

    // Método para eliminar todos los registros
    serviceClass += `    public void deleteAll${className}s() {\n`;
    serviceClass += `        ${this.toCamelCase(className)}Repository.deleteAll();\n`;
    serviceClass += `    }\n\n`;

    // Método para convertir Entity a DTO
    serviceClass += `    private ${dtoClassName} convertToDTO(${className} ${this.toCamelCase(className)}) {\n`;
    serviceClass += `        ${dtoClassName} dto = new ${dtoClassName}();\n`;
    for (let attribute of this.attributes) {
      const [attrName] = attribute.split(':').map(s => s.trim());
      const capitalizedAttr = attrName.charAt(0).toUpperCase() + attrName.slice(1);
      serviceClass += `        dto.set${capitalizedAttr}(${this.toCamelCase(className)}.get${capitalizedAttr}());\n`;
    }
    serviceClass += `        return dto;\n`;
    serviceClass += `    }\n\n`;

    // Método para convertir DTO a Entity
    serviceClass += `    private ${className} convertToEntity(${dtoClassName} ${this.toCamelCase(dtoClassName)}) {\n`;
    serviceClass += `        ${className} entity = new ${className}();\n`;
    for (let attribute of this.attributes) {
      const [attrName] = attribute.split(':').map(s => s.trim());
      const capitalizedAttr = attrName.charAt(0).toUpperCase() + attrName.slice(1);
      serviceClass += `        entity.set${capitalizedAttr}(${this.toCamelCase(dtoClassName)}.get${capitalizedAttr}());\n`;
    }
    serviceClass += `        return entity;\n`;
    serviceClass += `    }\n\n`;

    serviceClass += `}\n`;
    return serviceClass;
  }
  // Método para generar la clase Controller
  generateControllerClass() {
    const className = this.name;
    const dtoClassName = className + 'DTO';
    let controllerClass = `package com.example.demo.controller;\n\n`;
    controllerClass += `import com.example.demo.dto.${dtoClassName};\n`;
    controllerClass += `import com.example.demo.service.${className}Service;\n`;
    controllerClass += `import org.springframework.beans.factory.annotation.Autowired;\n`;
    controllerClass += `import org.springframework.http.ResponseEntity;\n`;
    controllerClass += `import org.springframework.web.bind.annotation.*;\n\n`;
    controllerClass += `import java.util.List;\n`;
    controllerClass += `import java.util.Optional;\n\n`;
    controllerClass += `@RestController\n`;
    controllerClass += `@RequestMapping("/api/${this.toCamelCase(className)}s")\n`;
    controllerClass += `public class ${className}Controller {\n\n`;
    controllerClass += `    @Autowired\n`;
    controllerClass += `    private ${className}Service ${this.toCamelCase(className)}Service;\n\n`;

    // Endpoint para obtener todos los registros
    controllerClass += `    @GetMapping\n`;
    controllerClass += `    public List<${dtoClassName}> getAll${className}s() {\n`;
    controllerClass += `        return ${this.toCamelCase(className)}Service.getAll${className}s();\n`;
    controllerClass += `    }\n\n`;

    // Endpoint para obtener un registro por id
    controllerClass += `    @GetMapping("/{id}")\n`;
    controllerClass += `    public ResponseEntity<${dtoClassName}> get${className}ById(@PathVariable Long id) {\n`;
    controllerClass += `        Optional<${dtoClassName}> result = ${this.toCamelCase(className)}Service.get${className}ById(id);\n`;
    controllerClass += `        return result.map(ResponseEntity::ok)\n`;
    controllerClass += `                     .orElseGet(() -> ResponseEntity.notFound().build());\n`;
    controllerClass += `    }\n\n`;

    // Endpoint para crear un nuevo registro
    controllerClass += `    @PostMapping\n`;
    controllerClass += `    public ResponseEntity<${dtoClassName}> create${className}(@RequestBody ${dtoClassName} ${this.toCamelCase(dtoClassName)}) {\n`;
    controllerClass += `        ${dtoClassName} saved${className} = ${this.toCamelCase(className)}Service.create${className}(${this.toCamelCase(dtoClassName)});\n`;
    controllerClass += `        return ResponseEntity.ok(saved${className});\n`;
    controllerClass += `    }\n\n`;

    // Endpoint para actualizar un registro por id
    controllerClass += `    @PutMapping("/{id}")\n`;
    controllerClass += `    public ResponseEntity<${dtoClassName}> update${className}(@PathVariable Long id, @RequestBody ${dtoClassName} ${this.toCamelCase(dtoClassName)}) {\n`;
    controllerClass += `        Optional<${dtoClassName}> updated${className} = ${this.toCamelCase(className)}Service.update${className}(id, ${this.toCamelCase(dtoClassName)});\n`;
    controllerClass += `        return updated${className}.map(ResponseEntity::ok)\n`;
    controllerClass += `                            .orElseGet(() -> ResponseEntity.notFound().build());\n`;
    controllerClass += `    }\n\n`;

    // Endpoint para eliminar un registro por id
    controllerClass += `    @DeleteMapping("/{id}")\n`;
    controllerClass += `    public ResponseEntity<Void> delete${className}(@PathVariable Long id) {\n`;
    controllerClass += `        ${this.toCamelCase(className)}Service.delete${className}ById(id);\n`;
    controllerClass += `        return ResponseEntity.noContent().build();\n`;
    controllerClass += `    }\n\n`;

    // Endpoint para eliminar todos los registros
    controllerClass += `    @DeleteMapping\n`;
    controllerClass += `    public ResponseEntity<Void> deleteAll${className}s() {\n`;
    controllerClass += `        ${this.toCamelCase(className)}Service.deleteAll${className}s();\n`;
    controllerClass += `        return ResponseEntity.noContent().build();\n`;
    controllerClass += `    }\n\n`;

    controllerClass += `}\n`;
    return controllerClass;
  }
  // Método auxiliar para convertir a camelCase
  toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  generateXMI(xmlDoc) {
    // Create UML:Class element
    const classElement = xmlDoc.createElement('UML:Class');
    classElement.setAttribute('name', this.name);
    classElement.setAttribute('xmi.id', `EAID_${this.id}`);
    classElement.setAttribute('visibility', 'public');
    classElement.setAttribute('namespace', 'EAPK_PackageID'); // Replace with actual package ID
    classElement.setAttribute('isRoot', 'false');
    classElement.setAttribute('isLeaf', 'false');
    classElement.setAttribute('isAbstract', 'false');

    // ModelElement.taggedValue
    const taggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
    classElement.appendChild(taggedValues);

    // Classifier.feature
    const classifierFeature = xmlDoc.createElement('UML:Classifier.feature');

    // Attributes
    this.attributes.forEach((attr, index) => {
      const attributeElement = xmlDoc.createElement('UML:Attribute');
      attributeElement.setAttribute('name', attr);
      attributeElement.setAttribute('visibility', 'private');
      attributeElement.setAttribute('changeable', 'none');
      attributeElement.setAttribute('ownerScope', 'instance');
      attributeElement.setAttribute('targetScope', 'instance');

      // Attribute.initialValue
      const initialValue = xmlDoc.createElement('UML:Attribute.initialValue');
      const expression = xmlDoc.createElement('UML:Expression');
      initialValue.appendChild(expression);
      attributeElement.appendChild(initialValue);

      // StructuralFeature.type
      const featureType = xmlDoc.createElement('UML:StructuralFeature.type');
      const classifier = xmlDoc.createElement('UML:Classifier');
      classifier.setAttribute('xmi.idref', 'eaxmiid0'); // Adjust based on actual data type
      featureType.appendChild(classifier);
      attributeElement.appendChild(featureType);

      // ModelElement.taggedValue for attribute
      const attrTaggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
      attributeElement.appendChild(attrTaggedValues);

      classifierFeature.appendChild(attributeElement);
    });

    // Methods
    this.methods.forEach((method, index) => {
      const methodElement = xmlDoc.createElement('UML:Operation');
      methodElement.setAttribute('name', method);
      methodElement.setAttribute('visibility', 'public');
      methodElement.setAttribute('ownerScope', 'instance');
      methodElement.setAttribute('isQuery', 'false');
      methodElement.setAttribute('concurrency', 'sequential');

      // ModelElement.taggedValue for method
      const methodTaggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
      methodElement.appendChild(methodTaggedValues);

      // BehavioralFeature.parameter
      const parameters = xmlDoc.createElement('UML:BehavioralFeature.parameter');

      // Return parameter
      const returnParameter = xmlDoc.createElement('UML:Parameter');
      returnParameter.setAttribute('kind', 'return');
      returnParameter.setAttribute('visibility', 'public');

      // Parameter.type
      const paramType = xmlDoc.createElement('UML:Parameter.type');
      const classifier = xmlDoc.createElement('UML:Classifier');
      classifier.setAttribute('xmi.idref', 'eaxmiid2'); // Adjust based on actual return type
      paramType.appendChild(classifier);
      returnParameter.appendChild(paramType);

      // ModelElement.taggedValue for return parameter
      const paramTaggedValues = xmlDoc.createElement('UML:ModelElement.taggedValue');
      returnParameter.appendChild(paramTaggedValues);

      // Parameter.defaultValue
      const defaultValue = xmlDoc.createElement('UML:Parameter.defaultValue');
      const expression = xmlDoc.createElement('UML:Expression');
      defaultValue.appendChild(expression);
      returnParameter.appendChild(defaultValue);

      parameters.appendChild(returnParameter);
      methodElement.appendChild(parameters);

      classifierFeature.appendChild(methodElement);
    });

    classElement.appendChild(classifierFeature);

    return classElement;
  }
}
