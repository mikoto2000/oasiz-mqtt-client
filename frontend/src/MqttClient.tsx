import { useRef, useState, FormEvent, ChangeEvent, Fragment, forwardRef, useImperativeHandle } from 'react'
import mqtt from 'mqtt';
import { IPacket } from 'mqtt-packet';
import './MqttClient.css'

export type QoS = 0 | 1 | 2;

export type MqttConnection = {
  url: string;
  clientId: string;
  username: string;
  password: string;
};

export type PublishMessage = {
  topic: string;
  payload: string;
  qos: QoS;
  isRetain: boolean;
};

export type ReceivedMessage = {
  topic: string;
  payload: string;
};

export type SubscribeTopic = {
  name: string;
  qos: QoS;
};

export type MqttClientProps = {
  INITIAL_CONNECTION: MqttConnection;
  INITIAL_PUBLISH_MESSAGE: PublishMessage;
  INITIAL_ADD_SUBSCRIBE_TOPIC: SubscribeTopic;
  INITIAL_SUBSCRIBING_TOPICS: Map<string, SubscribeTopic>;
  INITIAL_RECEIVED_MESSAGES: Array<ReceivedMessage>;
}

const MqttClientInternal = (props: MqttClientProps, ref: any) => {
  useImperativeHandle(ref, () => {
    return {
      getCurrentContext() : MqttClientProps {
        return {
          INITIAL_CONNECTION: mqttConnection,
          INITIAL_PUBLISH_MESSAGE: publishMessage,
          INITIAL_ADD_SUBSCRIBE_TOPIC: addSubscribeTopic,
          INITIAL_SUBSCRIBING_TOPICS: subscribingTopics,
          INITIAL_RECEIVED_MESSAGES: receivedMessages
        }
      },
      end() : void {
        disconnect();
      }
    }
  });

  const [mqttConnection, setMqttConnection] = useState<MqttConnection>(props.INITIAL_CONNECTION);
  const [publishMessage, setPublishMessage] = useState<PublishMessage>(props.INITIAL_PUBLISH_MESSAGE);
  const [addSubscribeTopic, setAddSubscribeTopic] = useState<SubscribeTopic>(props.INITIAL_ADD_SUBSCRIBE_TOPIC);
  const [subscribingTopics, setSubscribingTopics] = useState<Map<string, SubscribeTopic>>(props.INITIAL_SUBSCRIBING_TOPICS);

  const [receivedMessages, setReceivedMessages] = useState<Array<ReceivedMessage>>(props.INITIAL_RECEIVED_MESSAGES);

  const clientRef = useRef<mqtt.MqttClient|null>(null)

  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState('');

  const KEEPALIVE_TIME = 30;

  const connect = () => {
    console.debug('start connect');

    if (isConnected) {
      disconnect();
    }

    // クライアントインスタンスの作成
    console.debug('create new client.');
    let newClient = mqtt.connect(mqttConnection.url, {
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
      setIsConnected(false);
    });

    newClient.on('message', (topic: string, payload: Buffer, packet: IPacket) => {
      let newMessage: ReceivedMessage = {
        topic: topic,
        payload: payload.toString()
      };
      console.debug(`onmessage: ${JSON.stringify(newMessage)}`);
      setReceivedMessages(prevMessages => prevMessages.concat([newMessage]));
    });

    clientRef.current = newClient;
    console.log(clientRef.current);
  };

  const disconnect = () => {
    console.debug(`disconnect: ${mqttConnection.url}`);
    if (clientRef.current) {
      clientRef.current.end();
    }
    setIsConnected(false);
  };

  const handleChangeMqttConnection = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    let name = event.currentTarget.name || '';
    console.debug(`handleConnection: ${name}: ${newValue}`);
    setMqttConnection({...mqttConnection, [name]: newValue});
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

  const handleSubmitAddSubscribeTopic = (event : FormEvent<HTMLFormElement>) => {
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
    <div className="MqttClient">
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
          <label>URL: </label><input type="text" name="url" onChange={handleChangeMqttConnection} value={mqttConnection.url}></input>
          <button type="submit" disabled={false}>{
            isConnected ?
              'disconnect'
              :
              'connect'
          }</button>
          <div><label>clientId: </label><input type="text" name="clientId" onChange={handleChangeMqttConnection} value={mqttConnection.clientId}></input></div>
          <div><label>username: </label><input type="text" name="username" onChange={handleChangeMqttConnection} value={mqttConnection.username}></input></div>
          <div><label>password: </label><input type="password" name="password" onChange={handleChangeMqttConnection} value={mqttConnection.password}></input></div>
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
            {receivedMessages.map((e,i) => <li key={i}>{e.topic}: {e.payload}</li>)}
          </ul>
        </section>
      </section>
    </div>
  )
};

export const MqttClient = forwardRef(MqttClientInternal);

