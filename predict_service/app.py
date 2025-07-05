from flask import Flask, request, jsonify
import joblib
import numpy as np

# Crear la aplicación Flask
app = Flask(__name__)

# Cargar el modelo Random Forest
model = joblib.load('./rf_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Obtener los datos enviados en la solicitud
        data = request.json
        print("Datos recibidos:", data)
        
        # Validar que sea un array de predicciones
        if not isinstance(data, list):
            data = [data]
        
        predictions = []
        
        for item in data:
            mes = item.get('mes')
            cantidad_productos = item.get('cantidad_productos')
            ticket_promedio = item.get('ticket_promedio')
            clientes_unicos = item.get('clientes_unicos')

            # Validar que todos los datos necesarios estén presentes
            if None in [mes, cantidad_productos, ticket_promedio, clientes_unicos]:
                return jsonify({'error': 'Faltan datos para realizar la predicción'}), 400

            # Preparar los datos para el modelo
            input_data = np.array([[mes, cantidad_productos, ticket_promedio, clientes_unicos]])
            print("Datos preparados para el modelo:", input_data)

            # Realizar la predicción
            prediccion = model.predict(input_data)
            print("Predicción generada:", prediccion)

            predictions.append({
                'mes': mes,
                'prediccion': float(prediccion[0])
            })

        # Devolver las predicciones como respuesta
        return jsonify(predictions)

    except Exception as e:
        print("Error en el servicio Flask:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'Servicio predictivo funcionando'})

# Ejecutar el servidor en puerto 5001
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)