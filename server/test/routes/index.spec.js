/* eslint-env mocha */
require('dotenv').config({ path: './test/utils/.env' });
const { expect } = require('chai');
const mongoose = require('mongoose');
const request = require('request-promise-native');

const { validBooking, validBookingDB } = require('../utils/test-data');
const apiUrl = `http://localhost:${process.env.SERVER_PORT}/api`;
let server;
let BookingModel;
before(async () => {
  server = await require('../../src/index.js');
  BookingModel = mongoose.model('Booking');
});
after(async () => {
  await server.close();
  await mongoose.connection.close();
});
describe('Booking API', () => {
  afterEach(async function () {
    await BookingModel.remove({}).exec();
  });

  describe('POST /api/booking', () => {
    it('Should create a valid booking', async () => {
      const body = validBooking;
      const {booking} = await request({ url: `${apiUrl}/booking`, method: 'POST', json: true, body });
      expect(booking).to.have.property('id');
      expect(booking).to.have.property('publicKey');
      expect(booking).to.have.property('guestEthAddress', validBooking.guestEthAddress);
      expect(booking).to.have.property('paymentAmount');
      expect(booking).to.have.property('paymentType', validBooking.paymentType);
      expect(booking).to.have.property('signatureTimestamp');
      expect(booking.signatureTimestamp).to.have.a('number');
      expect(booking).to.have.property('personalInfo');
      expect(booking.personalInfo).to.have.property('name', validBooking.personalInfo.name);
      expect(booking.personalInfo).to.have.property('email', validBooking.personalInfo.email);
      expect(booking.personalInfo).to.have.property('birthday', validBooking.personalInfo.birthday);
      expect(booking.personalInfo).to.have.property('phone', validBooking.personalInfo.phone);
    });
    it('Should propagate data errors', async () => {
      const body = Object.assign({}, validBooking, { roomType: -1 });

      try {
        const res = await request({ url: `${apiUrl}/booking`, method: 'POST', json: true, body });
        throw new Error('should not be called');
      } catch (e) {
        expect(e).to.have.property('error');
        expect(e.error).to.have.property('code', '#invalidPaymentAmount');
      }
    });
  });

  describe('GET /api/booking/:id', () => {
    it('Should read a booking', async () => {
      const dbBooking = new BookingModel(validBookingDB);
      await dbBooking.save();
      const booking = await request({ url: `${apiUrl}/booking/${dbBooking.id}`, method: 'GET', json: true });
      expect(booking).to.have.property('id');
      expect(booking).to.have.property('publicKey');
      expect(booking).to.have.property('guestEthAddress', validBooking.guestEthAddress);
      expect(booking).to.have.property('paymentAmount');
      expect(booking).to.have.property('paymentType', validBooking.paymentType);
      expect(booking).to.have.property('signatureTimestamp');
      expect(booking.signatureTimestamp).to.have.a('number');
      expect(booking).to.have.property('personalInfo');
      expect(booking.personalInfo).to.have.property('name', validBooking.personalInfo.name);
      expect(booking.personalInfo).to.have.property('email', validBooking.personalInfo.email);
      expect(booking.personalInfo).to.have.property('birthday', validBooking.personalInfo.birthday);
      expect(booking.personalInfo).to.have.property('phone', validBooking.personalInfo.phone);
    });
    it('Should propagate data errors', async () => {
      try {
        await request({ url: `${apiUrl}/booking/some-invalid-id`, method: 'GET', json: true });
        throw new Error('should not be called');
      } catch (e) {
        expect(e).to.have.property('error');
        expect(e.error).to.have.property('code', '#notFound');
      }
    });
  });

  describe('DELETE /api/booking/:id', () => {
    it('Should delete a booking', async () => {
      const dbBooking = new BookingModel(validBookingDB);
      await dbBooking.save();
      const booking = await request({ url: `${apiUrl}/booking/${dbBooking.id}`, method: 'DELETE', json: true });
      const dbReadBooking = await BookingModel.findById(booking.id).exec();
      expect(booking).to.have.property('id', dbBooking.id);
      expect(dbReadBooking).to.be.an.equal(null);
    });
  });
});
