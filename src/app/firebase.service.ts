import { Injectable } from '@angular/core';
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { DocumentReference, QuerySnapshot } from 'firebase/firestore';
import { Observable, forkJoin, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private firestore: AngularFirestore) { }


  getAllProducts() {
    return this.firestore.collection('Products').snapshotChanges()
  }
  getProductById(productId: string): Observable<any> {
    return this.firestore.collection('Products').doc(productId).valueChanges();
  }
  getAllCustomers() {
    return this.firestore.collection('Customers').snapshotChanges()
  }
  getCustomerById(customerId: string): Observable<any> {
    return this.firestore.collection('Customers').doc(customerId).valueChanges();
  }
  getAllPurchases() {
    return this.firestore.collection('Purchases').snapshotChanges()
  }
  getOne(id: string) {
    return this.firestore.collection('Products').doc(id).valueChanges()
  }

  createUser(obj: any) {
    this.firestore.collection('Products').add(obj)
  }



  getHighestPurchaseId(): Promise<number | null> {
    return this.firestore.collection('Purchases', (ref: any) => ref.orderBy('id', 'desc').limit(1)).get()
      .pipe(
        map((snapshot: any) => {
          if (!snapshot.empty) {
            return snapshot.docs[0].data().id;
          } else {
            return null;
          }
        })
      )
      .toPromise()
      .catch((error: any) => {
        console.error('Error getting highest purchase ID:', error);
        return null;
      }) as Promise<number | null>;
  }

  createPurchase(purchase: any): Promise<void> {
    return this.firestore.collection('Purchases').add(purchase)
      .then(() => {
        console.log("purchase", purchase);
      })
      .catch((error) => {
        console.error('Error creating purchase:', error);
        throw error; // You can choose to throw the error or handle it as needed
      });

  }

  checkIfProductExists(productId: string): Observable<boolean> {
    const productDocRef = this.firestore.collection('Products').doc(productId);

    return productDocRef.get().pipe(
      map((doc) => {
        if (doc.exists) {
          // The document exists, so you can access its data, including the 'id' field.
          const productData: any = doc.data()
          const idFieldExists = productData.hasOwnProperty('id');
          const idFieldValue = productData['id:1'];
          console.log("idFieldValue", idFieldValue)
          return idFieldValue;

        } else {
          // The document doesn't exist.
          return false;
        }
      })
    );
  }
  updateProductQuantity(productId: number, change: number): Observable<void> {
    return this.firestore.collection('Products').doc(productId.toString()).get().pipe(
      switchMap((doc) => {
        console.log("yesss", doc)
        if (doc.exists) {
          console.log("yaff")
          const currentQuantity = doc.data() as { Quantity: number };
          if (currentQuantity.Quantity - change < 0) {
            return throwError('Quantity cannot be negative.');
          }
          const newQuantity = currentQuantity.Quantity - change;
          return this.firestore.collection('Products').doc(productId.toString()).update({ Quantity: newQuantity });
        } else {
          return throwError(`Document with IDd ${productId} does not exist.`);
        }
      }),
      catchError((error) => {
        console.error('Error updating product quantity:', error);
        return throwError(error);
      })
    );
  }


  updateProduct(productId: string, updatedData: any) {
    return this.firestore.collection('Products').doc(productId).update(updatedData);
  }


  deleteProduct(productId: string): Observable<void> {
    // Create a batch to perform multiple operations atomically
    const batch = this.firestore.firestore.batch();

    // Delete the product document
    const productRef = this.firestore.collection('Products').doc(productId).ref;
    batch.delete(productRef);

    // Delete all related purchases
    const purchasesRef = this.firestore.collection('Purchases').ref.where('ProductID', '==', productId);
    purchasesRef.get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const purchaseRef = this.firestore.collection('Purchases').doc(doc.id).ref;
        batch.delete(purchaseRef);
      });

      // Commit the batch to execute all operations
      batch.commit().then(() => {
        console.log('Product and related purchases deleted successfully.');
      }).catch((error) => {
        console.error('Error deleting product and related purchases:', error);
      });
    });

    // Return an Observable (you may need to import it)
    return from(batch.commit());
  }

  updateCustomer(customertId: string, updatedCustomerData: any) {
    return this.firestore.collection('Customers').doc(customertId).update(updatedCustomerData);
  }


  deleteCustomer(customerId: string): Observable<void> {
    // Create a batch to perform multiple operations atomically
    const batch = this.firestore.firestore.batch();

    // Delete the product document
    const productRef = this.firestore.collection('Customers').doc(customerId).ref;
    batch.delete(productRef);

    // Delete all related purchases
    const purchasesRef = this.firestore.collection('Purchases').ref.where('CusomertID', '==', customerId);
    purchasesRef.get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const purchaseRef = this.firestore.collection('Purchases').doc(doc.id).ref;
        batch.delete(purchaseRef);
      });

      // Commit the batch to execute all operations
      batch.commit().then(() => {
        console.log('Product and related purchases deleted successfully.');
      }).catch((error) => {
        console.error('Error deleting product and related purchases:', error);
      });
    });

    // Return an Observable (you may need to import it)
    return from(batch.commit());
  }

  getCustomerPurchases(customerId: string): Observable<any[]> {
    return this.firestore
      .collection('Purchases', (ref) => ref.where('CustomerID', '==', customerId))
      .valueChanges();
  }


  findProductById(productId: string) {
    // Replace 'Products' with the name of your Firestore collection
    return this.firestore
      .collection('Products')
      .doc(productId)
      .get()
      .toPromise() // Convert to a Promise
      .then((doc: any) => {
        if (doc.exists) {
          // Product with the specified ID found
          const product = doc.data();
          console.log('Found product:', product);
          return product;
        } else {
          // Product not found
          console.error('Product not found');
          return null;
        }
      })
      .catch((error) => {
        // Handle any errors
        console.error('Error fetching product:', error);
        return null;
      });
  }
  addPurchase(purchaseData: any): Promise<void> {
    // Generate a new document with a unique ID in the "Purchases" collection
    const purchaseRef = this.firestore.collection('Purchases').doc();

    // Set the purchase data for the newly created document
    return purchaseRef.set(purchaseData);
  }
  findProductById1(productId: string): Observable<any> {
    return this.firestore.collection('Products').doc(productId).valueChanges();
  }

}
