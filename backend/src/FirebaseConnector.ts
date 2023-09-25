import { firestore } from "firebase-admin";
import { OrderByDirection, WhereFilterOp } from "firebase-admin/firestore";
import {
  GenericFirebaseBatch,
  GenericFirestoreCollectionQuery,
  GenericFirestoreDocQuery,
  GenericFirestoreDocument,
  Model,
  ModelFirebaseConnector,
} from "shared";

export default class FirebaseConnector implements ModelFirebaseConnector {
  async save(
    ref: string,
    obj: object,
    batch?: GenericFirebaseBatch,
  ): Promise<void> {
    if (batch != null) {
      batch.set(firestore().doc(ref), obj);
    } else {
      await firestore().doc(ref).set(obj);
    }
  }

  async saveInCollection(
    collectionRef: string,
    obj: object,
  ): Promise<{ id: string; path: string }> {
    return firestore().collection(collectionRef).add(obj);
  }

  loadDocumentData(ref: string): Promise<GenericFirestoreDocument> {
    return firestore().doc(ref).get();
  }

  onSnapshotFromRef(
    ref: string,
    callback: (data: GenericFirestoreDocument) => void,
  ): () => void {
    return firestore().doc(ref).onSnapshot(callback);
  }

  getBatch(): GenericFirebaseBatch {
    return firestore().batch();
  }

  async delete(ref: string, batch?: GenericFirebaseBatch): Promise<void> {
    if (batch != null) {
      batch.delete(firestore().doc(ref));
    } else {
      await firestore().doc(ref).delete();
    }
  }

  collection(ref: string): GenericFirestoreCollectionQuery {
    return new CollectionQuery(ref);
  }

  doc(ref: string): GenericFirestoreDocQuery {
    return new DocumentQuery(ref);
  }
}

class CollectionQuery implements GenericFirestoreCollectionQuery {
  query: firestore.CollectionReference | firestore.DocumentData;

  constructor(path: string) {
    this.query = firestore().collection(path);
  }

  startAfter(path: string): CollectionQuery {
    this.query = this.query.startAfter(path);
    return this;
  }

  where(field: string, operator: WhereFilterOp, value: any): CollectionQuery {
    this.query = this.query.where(field, operator, value);
    return this;
  }

  limit(limit: number): CollectionQuery {
    this.query = this.query.limit(limit);
    return this;
  }

  orderBy(field: string, order: OrderByDirection): CollectionQuery {
    this.query = this.query.orderBy(field, order);
    return this;
  }

  async get<T extends Model>(model: new () => T): Promise<T[]> {
    return Model.loadDataModelCollection(await this.query.get(), model);
  }

  async add(obj: object): Promise<GenericFirestoreDocument> {
    return this.query.add(obj);
  }
}

class DocumentQuery implements GenericFirestoreDocQuery {
  query: firestore.DocumentReference;

  constructor(path: string) {
    this.query = firestore().doc(path);
  }

  async delete(): Promise<void> {
    await this.query.delete();
  }

  async set(data: object): Promise<void> {
    await this.query.set(data);
  }

  async get<T extends Model>(model: new () => T): Promise<T> {
    return Model.loadDataModelFromDocument(await this.query.get(), model);
  }
}
