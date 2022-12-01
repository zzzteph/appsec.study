@include('include.header')

<section class="section pt-3">
   <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>

            <li><a href="{{route('lessons',['topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
            <li class="is-active"><a href="#" >{{$lesson->lab->name}}</a></li>
         </ul>
      </nav>
      <hr/>
   </div>
   <div class="container">
      <div class="content">
	   @if($node->status=='success'  )
         <h1 class="title has-text-success">{{$lesson->lab->name}} (done)</h1>

            @elseif($node->status=='fail')
			  <h1 class="title has-text-danger">{{$lesson->lab->name}}</h1>
			@else
							  <h1 class="title">{{$lesson->lab->name}}</h1>
            @endif
       
         {!! $lesson->lab->content !!}
      </div>
      <div class="content">
         @if(is_null($task))
         <div class="block">
            <form method="POST" action="{{route('start-task',['node_id' => $node->id])}}">
               @csrf
               <div class="field">
                  <div class="control">
                     <button class="button is-success">
                     <span class="icon-text">
                     <span class="icon">
                     <i class="fas fa-play"></i>
                     </span>
                     <span>Start</span>
                     </span>
                     </button>
                  </div>
               </div>
            </form>
         </div>
         @elseif(!is_null($task) && ($task->topic_node_id==$node->id) &&  ($task->status=='todo'||$task->status=='starting'||$task->status=='tostop'||$task->status=='stopping'))
         <div  id="app" class="block">
            <progress class="progress is-small is-warning" v-if="vm.status=='todo'"  :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
            <progress class="progress is-small is-success" v-if="vm.status=='starting'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
            <progress class="progress is-small is-warning" v-if="vm.status=='tostop'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
            <progress class="progress is-small is-danger" v-if="vm.status=='stopping'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>	  
         </div>
         @elseif(!is_null($task) && ($task->topic_node_id==$node->id) &&  ($task->status=='running'))
         
         
         @if($lesson->lab->type=='attack')
         <div class="block" id="app">
            <div class="content">
               <p><a href="http://{{$task->ip}}" class="button is-success is-fullwidth" target="_blank"> Open Lab</a></p>
            </div>
         </div>
          @elseif($lesson->lab->type=='defense')
         <div class="block" id="app">
            <div class="content">
               <p><a href="http://{{$task->ip}}" class="button is-success is-fullwidth" target="_blank"> Open Lab</a></p>
               <p><a href="http://{{$task->ip}}:8081/" class="button is-warning is-fullwidth" target="_blank"> Edit code</a></p>
            </div>
         </div>
		@endif



         
         
         <div class="block">
            <form method="POST" action="{{route('stop-task',['node_id' => $node->id])}}">
               @method('DELETE')
               @csrf
               <div class="field">
                  <div class="control">
                     <button class="button is-danger is-small">
                     <span class="icon-text icon-text is-align-items-center">
                     <span class="icon">
                     <i class="fas fa-stop-circle"></i>
                     </span>
                     <span>Stop</span>
                     </span>
                     </button>
                  </div>
               </div>
            </form>
         </div>
         @else
         <div class="block">
            <form method="POST" action="{{route('start-task',['node_id' => $node->id])}}">
               @csrf
               <div class="field">
                  <div class="control">
                     <button class="button is-success" disabled>
                     <span class="icon-text">
                     <span class="icon">
                     <i class="fas fa-play"></i>
                     </span>
                     <span>Start</span>
                     </span>
                     </button>
                  </div>
               </div>
            </form>
         </div>
         @endif
      </div>
      <hr/>
   </div>
   <div class="container">
   <div class="icon-text is-size-5  is-align-items-center">
      <span class="icon has-text-info is-large">
      <i class="fas fa-question-circle fas fa-lg"></i>
      </span>
      <span>{{$lesson->lab->correct_questions($node->user_topic_node->id)}} of {{$lesson->lab->questions_count}}</span>
   </div>
   @foreach ($lesson->lab->questions as $question)
   @if( $question->correct($node->user_topic_node->id)) 
   <div class="content box has-background-success-light ">
      <p>{!! $question->question !!}</p>
      @if( $question->type=='string') 
      <p><strong>{{$question->answer->answer}}</strong></p>
      @elseif( $question->type=='repeat' || $question->type=='vuln')
      @foreach($question->user_answers($node->user_topic_node->id) as $answer)
      <li>{{$answer->answer}}</li>
      @endforeach
      @endif
	  
	  		 @if($question->hints()->count()>0)
		 <hr/>
		 <p><strong>Hints</strong></p>
		@foreach ($question->hints as $hint)
		 
		 @if($hint->bought==TRUE)
		 
		  <p>{!! $hint->hint !!}</p>
		 @endif
		@endforeach	 

		  @endif
	  
	  
	  </div>
      @elseif(!$question->correct($node->user_topic_node->id) && ($node->status!='success' && $node->status!='fail'))
      <div class="content box">
         <form method="POST" action="{{route('question-answer',['topic_id' => $topic->id,'node_id' => $node->id])}}">
            @csrf
            <input type="hidden" name="question_id" value="{{$question->id}}">
            <div class="field">
               <div class="control">
                  {!! $question->question !!}
               </div>
               <br/>
               @if( $question->type=='repeat' || $question->type=='vuln')
               <ul>
                  @foreach($question->user_answers($node->user_topic_node->id) as $answer)
                  <li>{{$answer->answer}}</li>
                  @endforeach
               </ul>
               @endif
               @if( $question->type!='yes') 
               <div class="control">
                  <input class="input" type="text" name="answer" placeholder="Text input">
               </div>
               @else
               <input type="hidden" name="answer" value="yes">
               @endif
            </div>
            
			@if( $question->type!='yes') 
			<div class="field">
               <div class="control">
                  <button class="button is-success">
                  <span class="icon-text is-align-items-center">
                  <span class="icon">
                  <i class="fas fa-paper-plane"></i>
                  </span>
                  <span>Answer</span>
                  </span>
                  </button>
               </div>
            </div>
			@else
			<div class="field">
               <div class="control">
                  <button class="button is-success">
                  <span class="icon-text is-align-items-center">
                  <span class="icon">
                  <i class="fas fa-check-square"></i>
                  </span>
                  <span>Done!</span>
                  </span>
                  </button>
               </div>
            </div>
			@endif
         </form>
		 @if($question->hints()->count()>0)
		 <hr/>
		 <p><strong>Hints</strong></p>
		@foreach ($question->hints as $hint)
		 
		 @if($hint->bought==TRUE)
		 
		 <p>{!! $hint->hint !!}</p>
		 @endif
		@endforeach	 
		 <div class="columns is-gapless">
		@foreach ($question->hints as $hint)
		 
		 @if($hint->bought!=TRUE)
			 <div class="column is-one-fifth">
		  <form method="POST" action="{{route('question-hint',['topic_id' => $topic->id,'node_id' => $node->id,'question_id'=>$question->id,'hint_id'=>$hint->id])}}">
            @csrf

			 @if($hint->price<=100)
		 <button class="button is-success">
	 @elseif($hint->price>100 && $hint->price<=200)
	 <button class="button is-warning">
	 @else
	 <button class="button is-danger">
 @endif
		          <span class="icon-text is-align-items-center">
 
                  <span> {{$hint->price/100}}</span>
				  
				   <span class="icon">
					<i class="fas fa-coins"></i>
                  </span>
				  
                  </span>
		 </button>

			</form>
			</div>
		  @endif
		 
		@endforeach	 
		 </div>
		  @endif
		 
		 
		 
		
      </div>
      @break
      @endif
      @endforeach
   
</section>
@if(!is_null($task) && ($task->topic_node_id==$node->id) &&  ($task->status=='todo' || $task->status=='starting' || $task->status=='tostop' || $task->status=='stopping'))
<script>
   new Vue({
       el: "#app",
       data: {
           vm: null,
           interval: null,
   
       },
   
   
       methods: {
   
           getVM: function(event) {
               axios.get('/api/v1/task/{{Auth::user()->current_user_lab_vm()->id}}').then((response) => {
                   this.vm = response.data;
   				if(this.vm.status=='running' || this.vm.status=='terminated') 
   				{
   					document.location.reload(true);
   				}
               }).catch(error => {
   			if(error.response && error.response.status === 404) {
        document.location.reload(true);
       }
   			
   			});
   
           },
   		
       },
       mounted: function() {
   	this.getVM();
       var self = this;
       this.interval=setInterval(function() {			self.getVM();    }, 2000);
       }
   
   });
</script>
@endif
@include('include.footer')
