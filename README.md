# Introduction

The world of recommendation systems can be roughly divided into content-based recommendation and collaborative filtering. In content-based recommendation, if a user likes a particular item, similar items are recommended. By contrast, collaborative filtering is based on shared preferences among users. For example, if user A likes apples, bananas, and kiwi, and user B likes apples, bananas, and mango, it's likely that A and B share similar tastes. Therefore, A might enjoy mango, while B might like kiwi.

This project delves into the realm of collaborative filtering, applying machine learning and optimization algorithms to demonstrate how Pupil's mobile app effectively matches each mentee with mentors. For those already familiar with collaborative filtering algorithms, feel free to jump ahead to the Getting Started section.

# Getting Started

## The Core Idea of Collaborative Filtering

Collaborative filtering in recommendation systems primarily deals with missing data. Take movie recommendations as an example. Given the vast number of movies available for review, it's impractical for a single user to watch a significant portion of them. If we represent the ratings of all movies by all users in a matrix, we find that most entries are missing, except for a few – a property known as sparsity. Our objective is to predict and recover every user's preference for every movie based on these sparse data points.

### Visualizing with an Example: Image Completion

To illustrate, let's consider the famous painting of Mona Lisa, where only 30% of its data is randomly revealed (with the rest displayed as completely dark). By applying the softimpute algorithm (a simple collaborative filtering technique), we can significantly enhance the image's recognizability to human eyes.

<img src="https://github.com/hansssxyz/Pupil_Matching_Algorithm/blob/main/getting_started_example/mona_completed.png">
<img src="https://github.com/hansssxyz/Pupil_Matching_Algorithm/blob/main/getting_started_example/mona_incomplete.png">
[INSERT IMAGES HERE AND LINK TO Pupil_Matching_Algorithm/getting_started_example/MatrixCompletion_Algos_Demo.ipynb]

## Getting More Technical

It's important to note that all datasets used here are synthetically generated to respect user privacy. Dummy variables are created solely to demonstrate the functionality and mechanism of the machine learning algorithm.

# Matching_Score File

In our system, each student's information is encapsulated in a vector representing their demographics, skillset, and preferences in various areas like college majors, career interests, and social causes. Similarly, each mentor's profile is embedded, capturing additional features like past associations with educational programs. The collaborative filtering model (CF_model) is developed using TensorFlow's sparse tensor and trained with the following logistics: a) loss = mean square loss from actual user feedback, b) regularization parameter = gravity model, c) hyperparameter tuned with a batch size of 1/20th of the entire dataset. The train-test ratio is set to 80:20, and the results are visualized to assist in tuning hyperparameters and adjusting the learning rate for real user data implementation.

# mentor_mentee_match_with_maxflowmincut File

This file takes the matching score matrix and applies a network model to ensure all mentees are paired with a mentor. The underlying algorithm is the max flow min cut algorithm, where a minimum matching score threshold is set. An edge is assigned between a mentor and mentee only if their matching score surpasses this threshold. The max flow of the graph corresponds to the number of mentees matched. If anyone remains unmatched, the algorithm lowers the threshold and reruns until everyone is paired.

This network model was chosen over a global error term approach to ensure that, in the worst case, every mentee receives a decent match, prioritizing overall coverage over optimizing matches for a subset of users.

# Contact

For a comprehensive understanding of the app's design, backend, and algorithms, please refer to the demo folders. Should you have any inquiries or wish to contribute, feel free to reach out at [hansss.shen@gmail.com](mailto:hansss.shen@gmail.com).
