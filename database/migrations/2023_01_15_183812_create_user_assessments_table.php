<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserAssessmentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_assessments', function (Blueprint $table) {
            $table->id();
			$table->foreignId('user_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			$table->foreignId('topic_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			$table->foreignId('assessment_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_assessments');
    }
}
