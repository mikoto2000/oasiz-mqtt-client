import { useState, MouseEvent } from 'react'
import { MqttClient, QoS, MqttConnection, PublishMessage, SubscribeTopic, ReceivedMessage, MqttClientProps } from './MqttClient'
import './App.css'

function App() {

  const DEFAULT_MQTT_CONNECTION : MqttConnection = {
    url: import.meta.env.VITE_MQTT_URL,
    clientId: 'OasizMqttClient_' + Math.random().toString(16).substr(2, 8),
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

  const DEFAULT_RECEIVED_MESSAGES : Array<ReceivedMessage> = [];

  const DEFAULT_MQTT_CONTEXT: MqttClientProps = {
    INITIAL_CONNECTION: DEFAULT_MQTT_CONNECTION,
    INITIAL_PUBLISH_MESSAGE: DEFAULT_PUBLISH_MESSAGE,
    INITIAL_ADD_SUBSCRIBE_TOPIC: DEFAULT_ADD_SUBSCRIBE_TOPIC,
    INITIAL_SUBSCRIBING_TOPICS: DEFAULT_SUBSCRIBING_TOPIC,
    INITIAL_RECEIVED_MESSAGES: DEFAULT_RECEIVED_MESSAGES,
  }

  const FIRST_MQTT_CONTEXT: MqttClientProps = {
    ...DEFAULT_MQTT_CONTEXT,
    INITIAL_CONNECTION: {...DEFAULT_MQTT_CONNECTION,
      username: 'pubuser',
      password: 'password',
    }
  }

  const SECOND_MQTT_CONTEXT: MqttClientProps = {
    ...DEFAULT_MQTT_CONTEXT,
    INITIAL_CONNECTION: {...DEFAULT_MQTT_CONNECTION,
      username: 'subuser',
      password: 'password',
    },
    INITIAL_SUBSCRIBING_TOPICS: new Map<string, SubscribeTopic>(
      [
        ["testtopic1/#", { name: "testtopic1/#", qos: 0 }],
        ["testtopic2/#", { name: "testtopic2/#", qos: 2 }],
      ]),
    INITIAL_RECEIVED_MESSAGES: [
      { topic: "testtopic1/1", payload: "test" },
      { topic: "testtopic1/2", payload: "tetest" },
      { topic: "testtopic2/1", payload: "tetest" },
    ],
  }

  const [currentMqttContext, setCurrentMqttContext] = useState<MqttClientProps>(DEFAULT_MQTT_CONTEXT);
  const [mqttContexts, setMqttContexts] = useState<Map<string, MqttClientProps>>(
    new Map<string, MqttClientProps>([['pubuser', FIRST_MQTT_CONTEXT], ['subuser', SECOND_MQTT_CONTEXT]]));

  const handleContextClick = (event: MouseEvent<HTMLAnchorElement>, contextName: string) => {
    event.preventDefault();
    console.debug(`handleContextClick: ${contextName}`);
    let newContext = mqttContexts.get(contextName) || DEFAULT_MQTT_CONTEXT;
    setCurrentMqttContext((prevContext) => newContext);
  }

  return (
    <div className="App">
      <h1>contexts:</h1>
      <ol>
        {[...mqttContexts.keys()].map((key) => <li key={key}><a href="#" onClick={(event) => handleContextClick(event, key)}>{key}</a></li>)}
      </ol>
      <MqttClient key={JSON.stringify(currentMqttContext)} {...currentMqttContext}></MqttClient>
    </div>
  )
}

export default App
