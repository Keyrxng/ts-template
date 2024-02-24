import Decimal from "decimal.js";
import { configGenerator } from "@ubiquibot/configuration";
import { generateErc20PermitSignature } from "./generate-erc20-permit-signature";

// @ts-expect-error globalThis
globalThis.window = undefined;
// @ts-expect-error globalThis
globalThis.importScripts = undefined;

/**
 * Encryption happens through pay.ubq.fi/keygen using libsodium
 * Libsodium does not want to play ball with the worker environment
 * I've tried the various sumo and non-sumo versions of the library
 * wrappers and the native version. None of them have worked.
 *
 * So with a little bit of hacking, I've managed to get the encryption
 * to work by using a blend of tweetnacl and libsodium.
 *
 * libsodium seals a box using the the ephemeral pubKey and the recipient's
 * to create a nonce only for that one operation. The epk is included in the
 * ciphertext for decrypting, the first 32 bytes of the ciphertext followed by
 * the actual encrypted message.
 *
 * The nonce is derived from the epk and the recipient's public key using blake2b
 * which is the same as the libsodium implementation.
 *
 * The decrypted message is then used as the private key for the bot wallet.
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const config = await configGenerator();

    let beneficiary = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    let amount = new Decimal(1000);
    let userId = "106303466";
    let issueId = "2151240545";

    try {
      const body = await request.json();
      beneficiary = body.beneficiary;
      amount = new Decimal(body.amount);
      userId = body.userId;
      issueId = body.issueId;
    } catch (err) {
      console.log("body json err: ", err);
    }

    const signature = await generateErc20PermitSignature({
      beneficiary,
      amount,
      userId,
      issueId,
      config,
    });
    return new Response(JSON.stringify({ signature }), { status: 200, headers: { "content-type": "application/json" } });
  },
};
