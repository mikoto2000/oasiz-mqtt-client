import { MqttClient, QoS, MqttConnection, PublishMessage, SubscribeTopic, MqttClientProps } from './MqttClient'
import './App.css'

function App() {

  const DEFAULT_MQTT_CONNECTION : MqttConnection = {
    url: import.meta.env.VITE_MQTT_URL,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: '',
    password: ''
  };

  const DEFAULT_PUBLISH_MESSAGE : PublishMessage = {
    topic: 'testtopic/1',
    payload: '',
    qos: 0,
    isRetain: false
  };

  const DEFAULT_ADD_SUBSCRIBE_TOPIC : SubscribeTopic = {
    name: "additional/subscribe/topic",
    qos: 0
  };

  const DEFAULT_SUBSCRIBING_TOPIC : Map<string, SubscribeTopic> =
      new Map<string, SubscribeTopic>([["testtopic/#", { name: "testtopic/#", qos: 0 }]]);


  const mqttClientProps: MqttClientProps = {
    INITIAL_CONNECTION: DEFAULT_MQTT_CONNECTION,
    INITIAL_PUBLISH_MESSAGE: DEFAULT_PUBLISH_MESSAGE,
    INITIAL_ADD_SUBSCRIBE_TOPIC: DEFAULT_ADD_SUBSCRIBE_TOPIC,
    INITIAL_SUBSCRIBING_TOPICS: DEFAULT_SUBSCRIBING_TOPIC
  }

  return (
    <div className="App">
      <MqttClient {...mqttClientProps}></MqttClient>
    </div>
  )
}

export default App
