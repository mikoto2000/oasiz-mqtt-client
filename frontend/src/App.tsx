import { useRef, useState, FormEvent, ChangeEvent, Fragment } from 'react'
import './App.css'
import * as MQTT from 'mqtt';
import { IPacket } from 'mqtt-packet';

function App() {

  type QoS = 0 | 1 | 2;

  type MqttConnection = {
    url: string;
    clientId: string;
    username: string;
    password: string;
  };

  type PublishMessage = {
    topic: string;
    payload: string;
    qos: QoS;
    isRetain: boolean;
  };

  type SubscribeTopic = {
    name: string;
    qos: QoS;
  };

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

  const [mqttConnection, setMqttConnection] = useState<MqttConnection>(DEFAULT_MQTT_CONNECTION);

  const [publishMessage, setPublishMessage] = useState<PublishMessage>(DEFAULT_PUBLISH_MESSAGE);

  const [addSubscribeTopic, setAddSubscribeTopic] = useState<SubscribeTopic>(DEFAULT_ADD_SUBSCRIBE_TOPIC);

  const [subscribingTopics, setSubscribingTopics] = useState<Map<string, SubscribeTopic>>(
          new Map<string, SubscribeTopic>([["testtopic/#", { name: "testtopic/#", qos: 0 }]]));

  const [receivedMessages, setReceivedMessages] = useState<Array<string>>([]);

  const clientRef = useRef<MQTT.MqttClient|null>(null)

  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState('');

  const KEEPALIVE_TIME = 30;

  const connect = () => {
    console.debug('start connect');
    if (!isConnected) {
      // クライアントインスタンスの作成
      let newClient = MQTT.connect(mqttConnection.url, {
        clientId: mqttConnection.clientId,
        username: mqttConnection.username,
        password: mqttConnection.password,
        keepalive: KEEPALIVE_TIME
      });

      console.debug(`connecting ${mqttConnection.url}...`);

      newClient.on('connect', () => {
        console.debug(`connected ${mqttConnection.url}`);

        subscribingTopics.forEach(topic => {
          console.debug(`start subscribe "${JSON.stringify(topic)}"`);
          newClient.subscribe(topic.name, { qos: topic.qos });
        });

        // エラーメッセージ削除
        setConnectError((prevError) => '');
        setIsConnected(true);
      });

      newClient.on('error', (error) => {
        console.debug(`error: ${mqttConnection.url} connct failed. ${error.message}`);

        // エラーメッセージ設定
        setConnectError((prevError) => error.message);

        // connect 時のエラーの際は、再接続せずに終了する
        newClient.end();
      });

      newClient.on('message', (topic: string, payload: Buffer, packet: IPacket) => {
        let newMessage = `${topic} : ${payload.toString()}`;
        console.debug(`onmessage: ${newMessage}`);
        setReceivedMessages(prevMessages => prevMessages.concat([newMessage]));
      });

      clientRef.current = newClient;
    }
  };

  const disconnect = () => {
    console.debug(`disconnect: ${mqttConnection.url}`);
    if (clientRef.current) {
      clientRef.current.end();
    }
    setIsConnected(false);
  };

  const handleChangeMqttUrl = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangeMqttUrl: ${newValue}`);
    setMqttConnection({...mqttConnection, url: newValue});
  };

  const handleChangeMqttClientId = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangeMqttClientId: ${newValue}`);
    setMqttConnection({...mqttConnection, clientId: newValue});
  };

  const handleChangeMqttUserName = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangeMqttUserName: ${newValue}`);
    setMqttConnection({...mqttConnection, username: newValue});
  };

  const handleChangeMqttPassword = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    // console.debug(`handleChangeMqttPassword: ${newValue}`);
    setMqttConnection({...mqttConnection, password: newValue});
  };

  const handleConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug(`handleConnect: ${mqttConnection.url}`);
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleChangePublishMessage = (event : ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangePublishMessage: ${newValue}`);
    setPublishMessage({...publishMessage, payload: newValue});
  };

  const handleChangePublishQos = (event : ChangeEvent<HTMLInputElement>) => {
    console.debug(`handleChangePublishQos: ${event.currentTarget.value}`);

    let rawPublishQos = Number(event.currentTarget.value);

    // TODO: エラー表示
    setPublishMessage({...publishMessage, qos: toQos(rawPublishQos)});
  };

  const handleChangeRetain = (event : ChangeEvent<HTMLInputElement>) => {
    console.debug(`handleChangeRetain : ${event.currentTarget.checked}`);
    setPublishMessage({...publishMessage, isRetain: event.currentTarget.checked});
  };

  const handleChangeSendTopic = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handldeChangePublishMessage: ${newValue}`);
    setPublishMessage({...publishMessage, topic: newValue});
  };

  const handlePublishMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug(`handlePublishMessage: ${JSON.stringify(publishMessage)}`);
    if (clientRef.current) {
      let options = {
        QoS: publishMessage.qos,
        retain: publishMessage.isRetain
      };
      clientRef.current.publish(publishMessage.topic, publishMessage.payload, options);
    }
  };

  const handleRemoveRetainMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug(`handleRemoveRetainMessage: ${JSON.stringify(publishMessage.topic)}`);
    if (clientRef.current) {
      let options = {
        retain: true
      };
      clientRef.current.publish(publishMessage.topic, '', options);
    }
  };

  const handleChangeSubscribeTopic = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangeSubscribeTopic: ${newValue}`);
    setAddSubscribeTopic({...addSubscribeTopic, name: newValue});
  };

  const handleChangeSubscribeQos = (event : ChangeEvent<HTMLInputElement>) => {
    console.debug(`handleChangeSubscribeQos : ${event.currentTarget.value}`);

    let rawSubscribeQos = Number(event.currentTarget.value);

    // TODO: エラー表示
    setAddSubscribeTopic({...addSubscribeTopic, qos: toQos(rawSubscribeQos)});
  };

  const handleSubmitAddSubscribeTopic = (event : ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug(`handleSubmitAddSubscribeTopic: ${addSubscribeTopic.name}, QoS: ${addSubscribeTopic.qos}`);
    if (clientRef.current) {
      clientRef.current.subscribe(addSubscribeTopic.name, { qos: addSubscribeTopic.qos });
    }
    setSubscribingTopics(prevTopics => {
      let newMap = new Map<string, SubscribeTopic>(prevTopics);
      newMap.set(addSubscribeTopic.name, addSubscribeTopic);
      return newMap;
    });
  };

  const handleDeleteSubscribeTopic = (event : React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    let targetTopic = event.currentTarget.value;
    console.debug(`handleDeleteSubscribeTopic : ${targetTopic}`);
    if (clientRef.current) {
      clientRef.current.unsubscribe(targetTopic);
    }
    setSubscribingTopics(prevTopics => {
      let newMap = new Map<string, SubscribeTopic>(prevTopics);
      newMap.delete(targetTopic);
      return newMap;
    });
  };

  const toQos = (qos : number) : QoS  => {
    if (![0, 1, 2].includes(qos)) {
      throw new Error(`error: ${qos} は QoS の値として正しくありません(0 or 1 or 2)`);
    }
    return qos as QoS
  }

  return (
    <div className="App">
      <h1>OASIZ MQTT Client</h1>
      <section>
        <h2>Connection</h2>
        <div>
          <label>{
            isConnected ?
              `connected to ${mqttConnection.url}.`
              :
              "not connected."
          }</label>
        </div>
          {
            connectError !== '' ?
            <div><label>`Error: ${connectError}`</label></div>
              :
              <></>
          }
        <form onSubmit={handleConnect}>
          <label>URL: </label><input type="text" name="mqttUrl" onChange={handleChangeMqttUrl} value={mqttConnection.url}></input>
          <button type="submit" disabled={false}>{
            isConnected ?
              'disconnect'
              :
              'connect'
          }</button>
          <div><label>clientId: </label><input type="text" name="mqttClientId" onChange={handleChangeMqttClientId} value={mqttConnection.clientId}></input></div>
          <div><label>username: </label><input type="text" name="mqttUserName" onChange={handleChangeMqttUserName} value={mqttConnection.username}></input></div>
          <div><label>password: </label><input type="password" name="mqttPassword" onChange={handleChangeMqttPassword} value={mqttConnection.password}></input></div>
        </form>
      </section>
      <section>
        <h2>Publish</h2>
        <form onSubmit={handlePublishMessage}>
          <div>
            <label>topic: </label><input type="text" onChange={handleChangeSendTopic} value={publishMessage.topic}></input>
          </div>
          <div>
            <label>message: </label><textarea onChange={handleChangePublishMessage} value={publishMessage.payload}></textarea>
            <label>QoS: </label><input type="number" min={0} max={2} onChange={handleChangePublishQos} value={publishMessage.qos}></input>
            <label>retain: </label><input type="checkbox" onChange={handleChangeRetain} checked={publishMessage.isRetain}></input>
          </div>
          <button type="submit" disabled={false}>publish</button>
        </form>
        <form onSubmit={handleRemoveRetainMessage}>
          <button type="submit" disabled={false}>remove retain message</button>
        </form>
      </section>
      <section>
        <h2>Subscribe</h2>
        <form onSubmit={handleSubmitAddSubscribeTopic}>
          <label>add subscribe topic: </label><input type="text" onChange={handleChangeSubscribeTopic} value={addSubscribeTopic.name}></input>
          <label>QoS: </label><input type="number" min={0} max={2} onChange={handleChangeSubscribeQos} value={addSubscribeTopic.qos}></input>
          <button type="submit" disabled={false}>start subscribe</button>
        </form>
        <section>
          <h2>subscribing topics</h2>
          <ul>
            {[...subscribingTopics.values()].map((e) => <Fragment key={e.name}><li>{e.name}, QoS: {e.qos}<button value={e.name} onClick={handleDeleteSubscribeTopic}>delete</button></li></Fragment>)}
          </ul>
        </section>
        <section>
          <h2>received messages:</h2>
          <ul>
            {receivedMessages.map((e,i) => <li key={i}>{e}</li>)}
          </ul>
        </section>
      </section>
    </div>
  )
}

export default App
