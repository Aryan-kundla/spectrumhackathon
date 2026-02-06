import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

model = tf.keras.applications.MobileNetV2(weights="imagenet")

def predict_food(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)

    preds = model.predict(img_array)
    decoded = tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=1)
    return decoded[0][0][1].lower()
