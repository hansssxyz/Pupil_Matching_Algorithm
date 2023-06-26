# Pupil_Matching_Algorithm

Please observev that all the dataset here is generated randomly. The dummy variables are created only to show the functionality and mechanism of the machine learning algo.

For brief explaination:

Matching_Score File:
1) Each student's information is embedded by a vector corresponding to their demographic information, personal skillset, and preferences in i) college majors(such as East Asian Studies), ii) career intererests(such as Entrepreneurship), iii) social causes(such as Disaster Relief). Each mentor's information is embedded in a similar manner, except that more features are captured such as their past association with particular educational programs such as QuestBridge, etc.
2) Then, a collaborative filtering model(CF_model) is developed with tensorflow sparese tensor, and trained with the following logistics: a)loss=mean square lost from the actual user feedback, b) regularation paramter= gravity model, c) hyperparamter tuned with batchsize of 1/20 of entire dataset
3) Train test ratio is set to 80:20. And the result is visualized to help tune the hyperparameters and adjust the learning rate when we actually implement the algorithm with real user data

mentor_mentee_match_with_maxflowmincut File:
this file takes in the matching score matrix from the previous file and applies a network model to ensure that all mentees get paired with a mentor. The idea behind the algorithm is the max flow min cut algo, in which we set up a minimum matching score and assign an edge between the mentor and mentee only if their matching score passes the threshold. then, the max flow of the graph would correspond to the number of mentees that get matched. if there's anyone who doesn't get matched, the algorithm lowers the minimum threshold and reruns until everyone gets matched.

We chose this network model instead of defining a globral error term because we'd prefer to have non-perfect macthing for everyone over having really good matching for some students while horrible matching for others(in which case, the loss of a specific entry would be offset by good performance on the rest of the dataset). In other words, we need to ensure that in the worst case, every mentee gets a decent match, rather than most mentees getting a good match.


