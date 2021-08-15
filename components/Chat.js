import React from 'react';
import { View, Text } from 'react-native';

export default class Chat extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { username } = this.props.route.params;
    this.props.navigation.setOptions({ title: `${username}` });
  };

  render() {
    let backColor = this.props.route.params.backColor;

    return (
      <View style={{flex: 1, backgroundColor: backColor, color: '#FFF'}}> 
        <Text>Welcome!</Text>
      </View>
    );
  };
}