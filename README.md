# Introduction

The world of recommendation systems can be roughly divided into content-based recommendation and collaborative filtering. In content-based recommendation, if a user likes a particular item, similar items are recommended. By contrast, collaborative filtering is based on shared preferences among users. For example, if user A likes apples, bananas, and kiwi, and user B likes apples, bananas, and mango, it's likely that A and B share similar tastes. Therefore, A might enjoy mango, while B might like kiwi.

This project delves into the realm of collaborative filtering, applying machine learning and optimization algorithms to demonstrate how Pupil's mobile app effectively matches each mentee with mentors. If you are already familiar with collaborative filtering algorithms, feel free to jump the Getting Started section.

# Getting Started

## The Core Idea of Collaborative Filtering

Collaborative filtering in recommendation systems primarily deals with missing data. Take movie recommendations as an example. Given the vast number of movies available for review, it's impractical for a single user to watch a significant portion of them. If we represent the ratings of all movies by all users in a matrix, we find that most entries are missing, except for a few – a property known as sparsity. Our objective is to predict and recover every user's preference for every movie based on these sparse data points.

### Visualizing with an Example: Image Completion

To illustrate, let's consider the famous painting of Mona Lisa, where only 30% of its data is randomly revealed (with the rest displayed as completely dark). By applying the softimpute algorithm (a simple collaborative filtering technique), we can significantly enhance the image's recognizability to human eyes.

<img src="https://github.com/hansssxyz/Pupil_Matching_Algorithm/blob/main/getting_started_example/mona_incomplete.png" alt="Incomplete Image" width=400>

```python
def soft_impute_ws(Y,OMEGA,lambda_vals,max_iter=500,tol=10**(-4)):
    num_iters,Bs=[],[]
    B=np.zeros(Y.shape)
    for lambda_val in reversed(lambda_vals):
        prev_objective=np.inf
        num_iter=0
        while num_iter<=max_iter:
            #update B by the observed entries of Y
            B[OMEGA]=Y[OMEGA]
            #SVD of B
            U,S,VT=np.linalg.svd(B,full_matrices=False)
            #apply soft thresholding operator
            S_threshold=np.maximum(S-lambda_val,0)
            B=U@np.diag(S_threshold)@VT
            #calculate objective 
            cur_objective=0.5*np.linalg.norm(OMEGA*(Y-B))**2+lambda_val*np.sum(S_threshold)
            #decide continue or break 
            if abs(prev_objective-cur_objective)/prev_objective<tol:
                break 
            else:
                prev_objective=cur_objective
                num_iter+=1
        num_iters.append(num_iter)
        Bs.append(B.copy())
    num_iters.reverse()
    Bs.reverse()
    return Bs,num_iters
```

<img src="https://github.com/hansssxyz/Pupil_Matching_Algorithm/blob/main/getting_started_example/mona_completed.png" alt="Completed Image" width=500>

[See the full demo, look here](https://github.com/hansssxyz/Pupil_Matching_Algorithm/blob/main/getting_started_example/MatrixCompletion_Algos_Demo.ipynb)

## Getting More Technical

It's important to note that all datasets used here are synthetically generated to respect user privacy. Dummy variables are created solely to demonstrate the functionality and mechanism of the machine learning algorithm.

# Matching_Score File

In our system, each student's information is encapsulated in a vector representing their demographics, skillset, and preferences in various areas like college majors, career interests, and social causes. Similarly, each mentor's profile is embedded, capturing additional features like past associations with educational programs. The collaborative filtering model (CF_model) is developed using TensorFlow's sparse tensor and trained with the following logistics: a) loss = mean square loss from actual user feedback, b) regularization parameter = gravity model, c) hyperparameter tuned with a batch size of 1/20th of the entire dataset. The train-test ratio is set to 80:20, and the results are visualized to assist in tuning hyperparameters and adjusting the learning rate for real user data implementation.

# mentor_mentee_match_with_maxflowmincut File

This file takes the matching score matrix and applies a network model to ensure all mentees are paired with a mentor. The underlying algorithm is the max flow min cut algorithm, where a minimum matching score threshold is set. An edge is assigned between a mentor and mentee only if their matching score surpasses this threshold. The max flow of the graph corresponds to the number of mentees matched. If anyone remains unmatched, the algorithm lowers the threshold and reruns until everyone is paired.

This network model was chosen over a global error term approach to ensure that, in the worst case, every mentee receives a decent match, prioritizing overall coverage over optimizing matches for a subset of users.

# Contact

For a comprehensive understanding of the app's design, backend, and algorithms, please refer to the demo folders. Should you have any inquiries or wish to contribute, feel free to reach out at [hansss.shen@gmail.com](mailto:hansss.shen@gmail.com).
