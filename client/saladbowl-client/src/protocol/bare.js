/* global BigInt */
/* UTILS */

function joinUint8Arrays(a, b) {
	let c = new Uint8Array(a.length + b.length);
	c.set(a, 0);
	c.set(b, a.length);
	return c;
}

function safeNumber(bigInt) {
	if (bigInt > MAX_U53 || bigInt < -MAX_U53) {
		throw RangeError("BigInt value out of double precision range (53 bits)");
	} else {
		return Number(bigInt);
	}
}

function stringifyJSON(object, space) {
	/* allow printing of bigint values in JSON for debugging: */
	return JSON.stringify(object, (key, value) => {
		if (typeof value === 'bigint')
			return value.toString() + 'n';
		else if (value instanceof UnionValue)
			return value.value;
		else
			return value;
	}, space);
}

const BIGINT_PATTERN = RegExp(/^\d+n$/);
function parseJSON(json) {
	/* allow parsing of JSON with bigint values */
	return JSON.parse(json,
		(key, value) => typeof value === 'string' && BIGINT_PATTERN.test(value) ? BigInt(value.slice(0, -1)) : value);
}

const MAX_U32 = 4294967295n // 2n ** 32n - 1n;
const MAX_U53 = 9007199254740991n// 2n ** 53n - 1n; // same as Number.MAX_SAFE_INTEGER
const MAX_U64 = 18446744073709551615n// 2n ** 64n - 1n;

// this is the maximum string length in spec,
// some browsers support less (eg. firefox with 2^30 - 2)
const MAX_STRING_LENGTH = MAX_U53;

// this is the maximum array length in spec,
// used for underlying data structure
const MAX_DATA_LENGTH = MAX_U32;
const MAX_ARRAY_LENGTH = MAX_U32;
const MAX_MAP_LENGTH = MAX_U32;

/* PRIMITIVE TYPES */

class BareType {
	/**
	 * pack(obj):
	 *      <obj>: a js object compatible with the layout of the class this is called on
	 *      returns: the binary representation of the class in a Uint8Array with values inserted from <obj>
	 */
	static pack(obj) {}

	/**
	 * unpack(raw):
	 *      <raw>: a DataView on the Uint8Array of the message bytes, offset to the start of the unprocessed bytes
	 *      returns: [an object with its values set according to the class layout, the number of bytes consumed by this operation]
	 */
	static unpack(raw) {}
}

class BarePrimitive extends BareType {
	static pack(value) {}
}

class BareUInt extends BarePrimitive {
	static pack(value) {
		value = BigInt(value);
		if (value > MAX_U64) {
			throw RangeError("Unsigned value out of 64-bit range");
		} else if (value < 0) {
			throw RangeError("Passed signed value to unsigned field");
		}
		let bytes = [];
		while (value >= 0x80n) {
			bytes.push(Number((value & 0xFFn) | 0x80n));
			value = value >> 7n;
		}
		bytes.push(Number(value));
		return Uint8Array.from(bytes);
	}

	static unpack(raw) {
		let value = 0n;
		for (let i = 0;; i++) {
			let byte = BigInt(raw.getUint8(i));
			if (byte < 0x80n) {
				value += byte << BigInt(7 * i);
				return [value, i + 1];
			}
			value += (byte & 0x7Fn) << BigInt(7 * i);
		}
	}
}
class BareInt extends BarePrimitive {
	static pack(value) {
		value = BigInt(value);
		if (value < 0) {
			value = ~(2n * value);
		} else {
			value = 2n * value;
		}
		if (value > MAX_U64) {
			throw RangeError("Signed value out of 64-bit range");
		}
		return BareUInt.pack(value);
	}

	static unpack(raw) {
		let [value, length] = BareUInt.unpack(raw);
		let sign = value % 2n;
		value = value / 2n;
		if (sign) {
			value = -(value + 1n);
		}
		return [value, length];
	}
}

class BareU8 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(1);
		let view = new DataView(bin.buffer);
		view.setUint8(0, value);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getUint8(0);
		return [value, 1];
	}
}
class BareU16 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(2);
		let view = new DataView(bin.buffer);
		view.setUint16(0, value, true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getUint16(0, true);
		return [value, 2];
	}
}
class BareU32 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(4);
		let view = new DataView(bin.buffer);
		view.setUint32(0, value, true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getUint32(0, true);
		return [value, 4];
	}
}
class BareU64 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(8);
		let view = new DataView(bin.buffer);
		view.setBigUint64(0, BigInt(value), true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getBigUint64(0, true);
		return [value, 8];
	}
}

class BareI8 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(1);
		let view = new DataView(bin.buffer);
		view.setInt8(0, value);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getInt8(0);
		return [value, 1];
	}
}
class BareI16 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(2);
		let view = new DataView(bin.buffer);
		view.setInt16(0, value, true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getInt16(0, true);
		return [value, 2];
	}
}
class BareI32 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(4);
		let view = new DataView(bin.buffer);
		view.setInt32(0, value, true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getInt32(0, true);
		return [value, 4];
	}
}
class BareI64 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(8);
		let view = new DataView(bin.buffer);
		view.setBigInt64(0, BigInt(value), true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getBigInt64(0, true);
		return [value, 8];
	}
}

class BareF32 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(4);
		let view = new DataView(bin.buffer);
		view.setFloat32(0, value, true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getFloat32(0, true);
		return [value, 4];
	}
}
class BareF64 extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(8);
		let view = new DataView(bin.buffer);
		view.setFloat64(0, value, true);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getFloat64(0, true);
		return [value, 8];
	}
}

class BareBool extends BarePrimitive {
	static pack(value) {
		let bin = new Uint8Array(1);
		let view = new DataView(bin.buffer);
		value = value ? 1 : 0;
		view.setUint8(0, value);
		return bin;
	}

	static unpack(raw) {
		let value = raw.getUint8(0);
		value = !!value;
		return [value, 1];
	}
}

function mapEnum(enumClass, keys) {
	let entries = Object.entries(keys);
	for (let i = 0; i < entries.length; i++) {
		let [key, name] = entries[i];
		enumClass[name] = key;
	}
	return keys;
}
class BareEnum extends BarePrimitive {
	// alternatively an array with gaps is allowed: ['ONE', 'TWO', , , 'FIVE']
	// this can also be done by index after the class definition:
	// Enum.keys[50] = 'SPECIAL';
	// although you then have to run mapEnum after that
	static keys; // = mapEnum(this, {0:'NAME1', 1:'NAME2', 4:'NAME5', ...})

	static pack(value) {
		if (!this.keys[value]) {
			throw ReferenceError("Invalid enum value");
		}
		let num = BigInt(value);
		return BareUInt.pack(num);
	}

	static unpack(raw) {
		let [value, bytes] = BareUInt.unpack(raw);
		if (value > MAX_U32) {
			throw RangeError("Enum value out of range");
		}
		if (!this.keys[value]) {
			throw ReferenceError("Invalid enum value");
		}
		value = Number(value);
		return [value, bytes];
	}
}

const BareUTF8Encoder = new TextEncoder();
const BareUTF8Decoder = new TextDecoder();

class BareString extends BarePrimitive {
	static pack(value) {
		let bytes = BareUTF8Encoder.encode(value);
		let length = BareUInt.pack(BigInt(bytes.length));
		return joinUint8Arrays(length, bytes);
	}

	static unpack(raw) {
		let [length, lenBytes] = BareUInt.unpack(raw);
		if (length > MAX_STRING_LENGTH) {
			throw RangeError("Invalid string length");
		}
		length = Number(length);
		let bytes = new DataView(raw.buffer, raw.byteOffset + lenBytes, length);
		let value = BareUTF8Decoder.decode(bytes);
		return [value, length + lenBytes];
	}
}

class BareDataFixed extends BarePrimitive {
	static length;

	static pack(value) {
		return value;
	}

	static unpack(raw) {
		let value = raw.buffer.slice(raw.byteOffset, raw.byteOffset + this.length);
		return [value, this.length];
	}
}
class BareData extends BarePrimitive {
	static pack(value) {
		let length = BareUInt.pack(BigInt(value.length));
		return joinUint8Arrays(length, value);
	}

	static unpack(raw) {
		let [length, lenBytes] = BareUInt.unpack(raw);
		if (length > MAX_DATA_LENGTH) {
			throw RangeError("Invalid array length");
		}
		length = Number(length);
		let value = raw.buffer.slice(raw.byteOffset + lenBytes, raw.byteOffset + lenBytes + length);
		return [value, length + lenBytes];
	}
}

class BareVoid extends BarePrimitive {
	// INVARIANT: may only be used as a member of sets in a tagged union
	static pack(value) {
		return new Uint8Array(0);
	}

	static unpack(raw) {
		return [null, 0];
	}
}

/* AGGREGATE TYPES */

class BareOptional extends BareType {
	static type;

	static pack(obj) {
		if (obj === undefined) {
			return Uint8Array.of(0);
		} else {
			let bytes = this.type.pack(obj);
			let bin = new Uint8Array(bytes.length + 1);
			bin.set([1], 0);
			bin.set(bytes, 1);
			return bin;
		}
	}

	static unpack(raw) {
		// make sure raw is a DataView, relevant if this is the top level element
		if (!(raw instanceof DataView)) {
			raw = new DataView(raw.buffer, raw.byteOffset);
		}
		let status = raw.getUint8(0);
		if (status === 0) {
			return [undefined, 1];
		} else {
			let [obj, bytes] = this.type.unpack(new DataView(raw.buffer, raw.byteOffset + 1));
			return [obj, bytes + 1];
		}
	}
}

class BareArrayFixed extends BareType {
	// INVARIANT: length is greater than 0
	static length;
	static type;

	static pack(obj) {
		let elements = new Uint8Array(0);
		for (let i = 0; i < this.length; i++) {
			let bytes = this.type.pack(obj[i]);
			elements = joinUint8Arrays(elements, bytes);
		}
		return elements;
	}

	static unpack(raw) {
		let obj = [];
		let length = 0;
		for (let i = 0; i < this.length; i++) {
			let view = new DataView(raw.buffer, raw.byteOffset + length);
			let [elem, bytes] = this.type.unpack(view);
			obj.push(elem);
			length += bytes;
		}
		return [obj, length];
	}
}
class BareArray extends BareType {
	static type;

	static pack(obj) {
		let bin = BareUInt.pack(BigInt(obj.length));
		for (let i = 0; i < obj.length; i++) {
			let bytes = this.type.pack(obj[i]);
			bin = joinUint8Arrays(bin, bytes);
		}
		return bin;
	}

	static unpack(raw) {
		// make sure raw is a DataView, relevant if this is the top level element
		if (!(raw instanceof DataView)) {
			raw = new DataView(raw.buffer, raw.byteOffset);
		}
		let obj = [];
		let [numElements, length] = BareUInt.unpack(raw);
		if (numElements > MAX_ARRAY_LENGTH) {
			throw RangeError("Invalid array length");
		}
		numElements = Number(numElements);
		for (let i = 0; i < numElements; i++) {
			let view = new DataView(raw.buffer, raw.byteOffset + length);
			let [elem, bytes] = this.type.unpack(view);
			length += bytes;
			obj.push(elem);
		}
		return [obj, length];
	}
}

class BareMap extends BareType {
	// INVARIANT: map key is a primitive data type but not void, data or data<length>
	static keyType;
	static valueType;

	static pack(obj) {
		let keys = Object.keys(obj);
		let bin = BareUInt.pack(BigInt(keys.length));
		for (let i = 0; i < keys.length; i++) {
			let keyBytes = this.keyType.pack(keys[i]);
			bin = joinUint8Arrays(bin, keyBytes);
			let valueBytes = this.valueType.pack(obj[keys[i]]);
			bin = joinUint8Arrays(bin, valueBytes);
		}
		return bin;
	}

	static unpack(raw) {
		// make sure raw is a DataView, relevant if this is the top level element
		if (!(raw instanceof DataView)) {
			raw = new DataView(raw.buffer, raw.byteOffset);
		}
		let obj = {};
		let [numEntries, length] = BareUInt.unpack(raw);
		if (numEntries > MAX_MAP_LENGTH) {
			throw RangeError("Invalid array length");
		}
		numEntries = Number(numEntries);
		for (let i = 0; i < numEntries; i++) {
			let keyView = new DataView(raw.buffer, raw.byteOffset + length);
			let [key, keyBytes] = this.keyType.unpack(keyView);
			length += keyBytes;
			let valueView = new DataView(raw.buffer, raw.byteOffset + length);
			let [value, valueBytes] = this.valueType.unpack(valueView);
			length += valueBytes;
			obj[key] = value;
		}
		return [obj, length];
	}
}

class UnionValue extends Object {
	constructor(type, value) {
		super();
		this.type = type;
		this.value = value;
	}
}

function mapUnion(unionClass, keys) {
	let indices = new Map();
	let entries = Object.entries(keys);
	for (let i = 0; i < entries.length; i++) {
		let [index, type] = entries[i];
		unionClass[index] = type;
		indices.set(type, index);
	}
	return indices;
}
class BareUnion extends BareType {
	// INVARIANT: has at least one type
	static indices; // = mapUnion(this, {i: <class>, ...})

	static pack(obj) {
		if (!(obj instanceof UnionValue)) {
			throw Error("A union value needs to be associated with its type by creating a UnionValue object:\n" + stringifyJSON(obj));
		}
		let objType = obj.type;
		let unionIndex = this.indices.get(objType);
		if (unionIndex === undefined) {
			throw Error("The union " + this.name + " does not support encoding the type " + objType.name)
		}
		let index = BareUInt.pack(unionIndex);
		let bytes = objType.pack(obj.value);
		return joinUint8Arrays(index, bytes);
	}

	static unpack(raw) {
		// make sure raw is a DataView, relevant if this is the top level element
		if (!(raw instanceof DataView)) {
			raw = new DataView(raw.buffer, raw.byteOffset);
		}
		let [index, length] = BareUInt.unpack(raw);
		let objType = this[index];
		let [obj, bytes] = objType.unpack(new DataView(raw.buffer, raw.byteOffset + length));
		obj = new UnionValue(objType, obj);
		return [obj, bytes + length];
	}
}

class BareStruct extends BareType {
	// INVARIANT: has at least one field
	static entries; // = [['key', type], ...]

	static pack(obj) {
		let bin = new Uint8Array(0);
		for (let i = 0; i < this.entries.length; i++) {
			let [key, type] = this.entries[i];
			let bytes = type.pack(obj[key]);
			bin = joinUint8Arrays(bin, bytes);
		}
		return bin;
	}

	static unpack(raw) {
		let obj = {};
		let length = 0;
		for (let i = 0; i < this.entries.length; i++) {
			let [key, type] = this.entries[i];
			let view = new DataView(raw.buffer, raw.byteOffset + length);
			let [value, bytes] = type.unpack(view);
			length += bytes;
			obj[key] = value;
		}
		return [obj, length];
	}
}

export {
	mapEnum, mapUnion, UnionValue,
	safeNumber, stringifyJSON, parseJSON,
	BareUInt, BareInt,
	BareU8, BareU16, BareU32, BareU64,
	BareI8, BareI16, BareI32, BareI64,
	BareF32, BareF64,
	BareBool,
	BareEnum,
	BareString,
	BareDataFixed, BareData,
	BareVoid,
	BareOptional,
	BareArrayFixed, BareArray,
	BareMap,
	BareUnion,
	BareStruct,
};

export default {
	mapEnum: mapEnum,
	mapUnion: mapUnion,
	UnionValue: UnionValue,
	safeNumber: safeNumber,
	stringifyJSON: stringifyJSON,
	parseJSON: parseJSON,
	UInt: BareUInt,
	Int: BareInt,
	U8: BareU8,
	U16: BareU16,
	U32: BareU32,
	U64: BareU64,
	I8: BareI8,
	I16: BareI16,
	I32: BareI32,
	I64: BareI64,
	F32: BareF32,
	F64: BareF64,
	Bool: BareBool,
	Enum: BareEnum,
	String: BareString,
	DataFixed: BareDataFixed,
	Data: BareData,
	Void: BareVoid,
	Optional: BareOptional,
	ArrayFixed: BareArrayFixed,
	Array: BareArray,
	Map: BareMap,
	Union: BareUnion,
	Struct: BareStruct,
};