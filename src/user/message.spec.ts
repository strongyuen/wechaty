#!/usr/bin/env -S node --no-warnings --loader ts-node/esm
/**
 *   Wechaty Chatbot SDK - https://github.com/wechaty/wechaty
 *
 *   @copyright 2016 Huan LI (李卓桓) <https://github.com/huan>, and
 *                   Wechaty Contributors <https://github.com/wechaty>.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

import {
  test,
  sinon,
}             from 'tstest'

import * as PUPPET        from 'wechaty-puppet'
import { PuppetMock }     from 'wechaty-puppet-mock'
import { WechatyBuilder } from '../wechaty-builder.js'

test('recalled()', async t => {

  const EXPECTED_RECALL_MESSAGE_ID = '1'
  const EXPECTED_RECALLED_MESSAGE_ID = '2'
  const EXPECTED_MESSAGE_TIMESTAMP = new Date().getTime()
  const EXPECTED_ROOM_TOPIC = 'topic'
  const EXPECTED_ROOM_ID = 'room1'
  const EXPECTED_FROM_CONTACT_ID = 'contact1'
  const EXPECTED_TO_CONTACT_ID = 'contact1'

  const sandbox = sinon.createSandbox()

  const puppet = new PuppetMock()
  const wechaty = new WechatyBuilder().options({ puppet }).build()

  await wechaty.start()

  sandbox.stub(puppet, 'messagePayload').callsFake(async (id) => {
    await new Promise(resolve => setImmediate(resolve))
    if (id === EXPECTED_RECALL_MESSAGE_ID) {
      return {
        id: EXPECTED_RECALL_MESSAGE_ID,
        text: EXPECTED_RECALLED_MESSAGE_ID,
        timestamp: EXPECTED_MESSAGE_TIMESTAMP,
        type: PUPPET.type.Message.Recalled,
      } as PUPPET.payload.Message
    } else {
      return {
        fromId: EXPECTED_FROM_CONTACT_ID,
        id: EXPECTED_RECALLED_MESSAGE_ID,
        roomId: EXPECTED_ROOM_ID,
        text: '',
        timestamp: EXPECTED_MESSAGE_TIMESTAMP,
        toId: EXPECTED_TO_CONTACT_ID,
        type: PUPPET.type.Message.Text,
      } as PUPPET.payload.Message
    }
  })
  sandbox.stub(puppet, 'roomPayload').callsFake(async () => {
    await new Promise(resolve => setImmediate(resolve))
    return {
      topic: EXPECTED_ROOM_TOPIC,
    } as PUPPET.payload.Room
  })

  sandbox.stub(puppet, 'roomMemberList').callsFake(async () => {
    await new Promise((resolve) => setImmediate(resolve))
    return [EXPECTED_FROM_CONTACT_ID, EXPECTED_TO_CONTACT_ID]
  })

  sandbox.stub(puppet, 'contactPayload').callsFake(async (id: string) => {
    await new Promise(setImmediate)
    return {
      id,
      name: id,
    } as PUPPET.payload.Contact
  })

  await puppet.login(EXPECTED_TO_CONTACT_ID)

  const message = wechaty.Message.load(EXPECTED_RECALL_MESSAGE_ID)
  await message.ready()
  const recalledMessage = await message.toRecalled()
  t.ok(recalledMessage, 'recalled message should exist.')
  t.equal(recalledMessage!.id, EXPECTED_RECALLED_MESSAGE_ID, 'Recalled message should have the right id.')
  t.equal(recalledMessage!.talker().id, EXPECTED_FROM_CONTACT_ID, 'Recalled message should have the right from contact id.')
  t.equal(recalledMessage!.listener()!.id, EXPECTED_TO_CONTACT_ID, 'Recalled message should have the right to contact id.')
  t.equal(recalledMessage!.room()!.id, EXPECTED_ROOM_ID, 'Recalled message should have the right room id.')

  await wechaty.stop()
})
