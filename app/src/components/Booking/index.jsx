import React, {Fragment} from 'react';
import Web3 from 'web3';
import BookingPoC  from '../../abis/BookingPoC.json';
import RoomsSection from './RoomsSection'
import FormSection from './FormSection'

const PRICES_BY_ROOMTYPE = {
  'pure-cozy': 150,
  'white-brown-comfort': 160
}

export default class BookingContainer extends React.Component {
  constructor(props) {
    super(props)
    this.web3 = new Web3(process.env.WEB3_PROVIDER);
    this.state = {
      isLoading: true,
      roomTypes: [],
      selectedRoom: {},
    }
  }

  async componentDidMount() {
      const bookingPoC = new this.web3.eth.Contract(BookingPoC.abi, process.env.BOOKING_POC_ADDRESS);
    try {
      const roomTypesResponse = await fetch(`${process.env.HOTEL_URL}/roomTypes`);
      const roomTypes = await roomTypesResponse.json();
      const mappedRooms = await Object.values(roomTypes).reduce(async (acc, room) => {
        acc = await acc
        const isFull = (await this._availability(bookingPoC, room.id)).some(availabilityFlag => !!parseInt(availabilityFlag))
        const price = PRICES_BY_ROOMTYPE[room.id]
        return [...acc, {...room, isFull, price}]
      }, [])
      this.setState({isLoading: false, roomTypes: mappedRooms});
    }catch (e) {
      this.setState({ isLoading: true});
      console.error(e);
    }
  }

  _availability = async (bookingPoC, roomType, nights = [1,2,3,4]) => {
    return bookingPoC.methods.roomsAvailable(roomType, nights).call();
  }
  // this is commented until we know if we need it
  /*
  _getMatrixAvailability = async (roomTypes) => {
    return Object.keys(roomTypes).reduce(async (acc, roomKey) => {
      acc = await acc;
      return {...acc, [roomKey]: await this._getRoomTypeAvailability(roomKey)}
    }, {});
  }

  _getRoomTypeAvailability = async(roomType) => {
    const nights = [1,2,3,4];
    const bookingPoC = new this.web3.eth.Contract(BookingPoC.abi, process.env.BOOKING_POC_ADDRESS);
    return nights.reduce(async (acc, night) => {
      acc = await acc;
      const availability = await this._availability(bookingPoC, roomType, [night]);
      return {...acc, [night]: availability}
    }, {})
  };

  isRoomTypeFulled = (roomType) => {
    const {availabilities} = this.state
    if (!availabilities) return
    return !Object.keys(availabilities[roomType])
      .some(day => availabilities[roomType][day].some(availabilityFlag => !!parseInt(availabilityFlag)))
  }
  */

  onRoomTypeChange = (selectedRoom) => {
    this.setState({selectedRoom})
  }

  render () {
    const {isLoading, selectedRoom, roomTypes} = this.state
    if (isLoading) return null // TODO should render a loading component
    return (
      <Fragment>
        <RoomsSection onRoomTypeChange={this.onRoomTypeChange} roomTypes={roomTypes}/>
        <FormSection onRoomTypeChange={this.onRoomTypeChange} selectedRoom={selectedRoom} roomTypes={roomTypes}/>
      </Fragment>
    )
  }
}